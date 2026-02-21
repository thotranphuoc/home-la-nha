import { Component, OnInit, OnDestroy, ViewChild, ElementRef, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { PropertyService } from '../../../core/services/property.service';
import { AssetService } from '../../../core/services/asset.service';
import { FinanceService } from '../../../core/services/finance.service';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

export interface BuildingRoi {
  name: string;
  revenue: number;
  costs: number;
  profit: number;
}

@Component({
  selector: 'app-overview',
  standalone: true,
  imports: [FormsModule, MatFormFieldModule, MatSelectModule, MatInputModule],
  template: `
    <h1>Tổng quan</h1>
    <div class="stats">
      <p>Số tòa nhà: {{ propertyService.buildingsCount() }}</p>
      <p>Số phòng: {{ propertyService.roomsCount() }}</p>
    </div>
    @if (propertyService.error()) {
      <p class="error">{{ propertyService.error() }}</p>
    }
    <div class="roi-section">
      <div class="roi-header">
        <h3>Biểu đồ ROI – Doanh thu, Chi phí & Lợi nhuận theo tòa nhà</h3>
        <div class="month-year">
          <mat-form-field appearance="outline">
            <mat-label>Tháng</mat-label>
            <mat-select [(ngModel)]="currentMonth" (selectionChange)="onPeriodChange()">
              @for (m of months; track m) {
                <mat-option [value]="m">{{ m }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
          <mat-form-field appearance="outline">
            <mat-label>Năm</mat-label>
            <input matInput type="number" [(ngModel)]="currentYear" (ngModelChange)="onPeriodChange()" min="2020" max="2030" />
          </mat-form-field>
        </div>
      </div>
      @if (loadingChart()) {
        <p>Đang tính...</p>
      } @else if (roiByBuilding().length === 0) {
        <p>Chưa có dữ liệu tòa nhà.</p>
      } @else {
        <div class="chart-wrap">
          <canvas #chartCanvas></canvas>
        </div>
        <p class="chart-note">Lợi nhuận ròng = Doanh thu − (HĐ chủ nhà + OpEx + Khấu hao)</p>
      }
    </div>
  `,
  styles: [`
    .error { color: #c62828; }
    .stats { margin-bottom: 1.5rem; }
    .roi-section { margin-top: 1.5rem; padding: 1rem; background: #f5f5f5; border-radius: 8px; max-width: 720px; }
    .roi-section h3 { margin: 0 0 0.5rem 0; font-size: 1rem; }
    .roi-header { display: flex; flex-wrap: wrap; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .month-year { display: flex; gap: 0.5rem; align-items: center; }
    .month-year mat-form-field { width: 90px; }
    .chart-wrap { position: relative; height: 320px; margin-bottom: 0.5rem; }
    .chart-note { font-size: 0.8rem; color: #666; margin: 0; }
  `],
})
export class OverviewComponent implements OnInit, OnDestroy {
  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;

  currentMonth = new Date().getMonth() + 1;
  currentYear = new Date().getFullYear();
  months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  loadingChart = signal(true);
  roiByBuilding = signal<BuildingRoi[]>([]);
  private chart: Chart<'bar'> | null = null;

  constructor(
    readonly propertyService: PropertyService,
    private readonly assetService: AssetService,
    private readonly financeService: FinanceService
  ) {
    Chart.register(...registerables);
  }

  onPeriodChange(): void {
    this.loadProfitChart();
  }

  async ngOnInit(): Promise<void> {
    await this.propertyService.loadBuildings();
    await this.propertyService.loadRooms();
    await this.assetService.loadAssets();
    await this.loadProfitChart();
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private async loadProfitChart(): Promise<void> {
    this.loadingChart.set(true);
    this.destroyChart();
    const buildings = this.propertyService.buildings();
    const data: BuildingRoi[] = [];
    for (const b of buildings) {
      const summary = await this.financeService.getBuildingMonthSummary(b.id, this.currentYear, this.currentMonth);
      data.push({ name: b.name, revenue: summary.revenue, costs: summary.costs, profit: summary.profit });
    }
    this.roiByBuilding.set(data);
    this.loadingChart.set(false);
    setTimeout(() => this.initChart(), 0);
  }

  private initChart(): void {
    const canvas = this.chartCanvas?.nativeElement;
    const data = this.roiByBuilding();
    if (!canvas || data.length === 0) return;
    this.destroyChart();
    const labels = data.map(d => d.name);
    const format = (v: number) => `${Number(v).toLocaleString('vi-VN')} VNĐ`;
    const config: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Doanh thu',
            data: data.map(d => d.revenue),
            backgroundColor: 'rgba(33, 150, 243, 0.8)',
            borderColor: '#2196f3',
            borderWidth: 1,
          },
          {
            label: 'Chi phí',
            data: data.map(d => d.costs),
            backgroundColor: 'rgba(255, 152, 0, 0.8)',
            borderColor: '#ff9800',
            borderWidth: 1,
          },
          {
            label: 'Lợi nhuận ròng',
            data: data.map(d => d.profit),
            backgroundColor: data.map(d => d.profit >= 0 ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)'),
            borderColor: data.map(d => d.profit >= 0 ? '#4caf50' : '#f44336'),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${format(Number(ctx.raw))}`,
            },
          },
        },
        scales: {
          y: {
            ticks: {
              callback: (value) => typeof value === 'number' ? value.toLocaleString('vi-VN') : value,
            },
          },
        },
      },
    };
    this.chart = new Chart(canvas, config);
  }
}
