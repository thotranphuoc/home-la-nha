import { Component, DestroyRef, Inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { debounceTime } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService } from '../../../core/services/tenant.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import type { OcrData, SocialMediaEntry, SocialMediaType } from '../../../core/services/tenant.service';

export type CccdZoomSide = 'front' | 'back';

export interface CccdZoomData {
  imageUrl: string;
  label: string;
  side: CccdZoomSide;
  tenantId: string;
  initialRotation: number;
  onRotationChange: (side: CccdZoomSide, degrees: number) => void;
}

const DRAFT_KEY_PREFIX = 'tenant_cccd_draft_';

/** Dialog: xoay ảnh, đóng (lưu góc xoay), xem full màn hình */
@Component({
  selector: 'app-cccd-zoom-dialog',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="zoom-dialog">
      <h2 mat-dialog-title>{{ data.label }}</h2>
      <mat-dialog-content>
        <div class="zoom-img-wrap">
          <img #zoomImg [src]="data.imageUrl" [alt]="data.label" class="zoom-img" [style.transform]="'rotate(' + rotation() + 'deg)'" />
        </div>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="toggleFullscreen(zoomImg)">
          <mat-icon>{{ isFullscreen() ? 'fullscreen_exit' : 'fullscreen' }}</mat-icon> {{ isFullscreen() ? 'Thoát toàn màn hình' : 'Xem toàn màn hình' }}
        </button>
        <button mat-button type="button" (click)="rotate()">
          <mat-icon>rotate_right</mat-icon> Xoay 90°
        </button>
        <button mat-button mat-dialog-close (click)="exitFullscreen()">Đóng</button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .zoom-dialog mat-dialog-content { overflow: auto; max-height: 80vh; }
    .zoom-img-wrap { display: flex; justify-content: center; align-items: center; width: 100%; max-width: 100%; min-height: 120px; }
    .zoom-img { max-width: 100%; max-height: 75vh; width: auto; height: auto; object-fit: contain; display: block; transition: transform 0.2s ease; box-sizing: border-box; }
    .zoom-img-fullscreen { max-width: 100vw; max-height: 100vh; width: auto; height: auto; object-fit: contain; margin: auto; }
  `],
})
export class CccdZoomDialogComponent {
  rotation: ReturnType<typeof signal<number>>;
  isFullscreen = signal(false);
  constructor(@Inject(MAT_DIALOG_DATA) public data: CccdZoomData) {
    this.rotation = signal(data.initialRotation ?? 0);
  }
  toggleFullscreen(img: HTMLImageElement): void {
    if (this.isFullscreen()) {
      this.exitFullscreen();
      return;
    }
    const deg = this.rotation();
    img.style.transform = `rotate(${deg}deg)`;
    img.classList.add('zoom-img-fullscreen');
    const el = img as unknown as { requestFullscreen?: () => Promise<void> };
    if (el.requestFullscreen) {
      el.requestFullscreen().then(() => this.isFullscreen.set(true)).catch(() => { img.classList.remove('zoom-img-fullscreen'); });
    }
  }
  exitFullscreen(): void {
    if (document.fullscreenElement) {
      (document.fullscreenElement as HTMLElement).classList.remove('zoom-img-fullscreen');
      document.exitFullscreen().then(() => this.isFullscreen.set(false)).catch(() => {});
    } else {
      this.isFullscreen.set(false);
    }
  }
  rotate(): void {
    const next = (this.rotation() + 90) % 360;
    this.rotation.set(next);
    this.data.onRotationChange(this.data.side, next);
  }
}

@Component({
  selector: 'app-tenant-profile',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule,
    MatTooltipModule,
  ],
  template: `
    <h1>Cập nhật thông tin CCCD</h1>
    @if (tenantService.loading()) {
      <p>Đang tải...</p>
    } @else if (!tenantService.tenant()) {
      <p>Chưa có hồ sơ khách thuê. Liên hệ quản lý.</p>
    } @else {
      <mat-card>
        <mat-card-content>
          @if (uploadError()) {
            <p class="error">{{ uploadError() }}</p>
          }
          <form [formGroup]="form" (ngSubmit)="onSubmit()">
            <div class="layout">
              <div class="form-section">
                <h3>Thông tin cá nhân từ CCCD</h3>
                <p class="hint">Điền đầy đủ thông tin theo CCCD. Số CCCD được che một phần khi hiển thị ở nơi khác.</p>

                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Số CCCD</mat-label>
                  <input matInput formControlName="id_number" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Họ và tên</mat-label>
                  <input matInput formControlName="full_name" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Ngày sinh</mat-label>
                  <input matInput formControlName="dob" placeholder="dd/mm/yyyy" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Giới tính</mat-label>
                  <mat-select formControlName="gender">
                    <mat-option value="">-- Chọn --</mat-option>
                    <mat-option value="Nam">Nam</mat-option>
                    <mat-option value="Nữ">Nữ</mat-option>
                    <mat-option value="Khác">Khác</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Quốc tịch</mat-label>
                  <input matInput formControlName="nationality" placeholder="Việt Nam" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Quê quán</mat-label>
                  <input matInput formControlName="place_of_origin" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nơi thường trú</mat-label>
                  <input matInput formControlName="place_of_residence" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Ngày cấp</mat-label>
                  <input matInput formControlName="date_of_issue" placeholder="dd/mm/yyyy" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nơi cấp</mat-label>
                  <input matInput formControlName="place_of_issue" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Ngày hết hạn</mat-label>
                  <input matInput formControlName="date_of_expiry" placeholder="dd/mm/yyyy" />
                </mat-form-field>

                <h3>Liên hệ & thông tin khác</h3>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Số điện thoại</mat-label>
                  <input matInput formControlName="phone" type="tel" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email</mat-label>
                  <input matInput formControlName="email" type="email" />
                </mat-form-field>
                <div class="mxh-section">
                  <h4>MXH</h4>
                  <div formArrayName="social_media">
                    @for (item of socialMediaArray().controls; track $index) {
                      <div [formGroupName]="$index" class="mxh-row">
                        <mat-form-field appearance="outline" class="mxh-type">
                          <mat-label>Loại</mat-label>
                          <mat-select formControlName="type">
                            <mat-option value="facebook">Facebook</mat-option>
                            <mat-option value="zalo">Zalo</mat-option>
                            <mat-option value="other">Khác</mat-option>
                          </mat-select>
                        </mat-form-field>
                        <mat-form-field appearance="outline" class="mxh-value">
                          <mat-label>{{ mxhLabel($index) }}</mat-label>
                          <input matInput formControlName="value" [placeholder]="mxhPlaceholder($index)" />
                        </mat-form-field>
                        <button mat-icon-button type="button" (click)="removeSocialMedia($index)" matTooltip="Xóa">
                          <mat-icon>close</mat-icon>
                        </button>
                      </div>
                    }
                  </div>
                  <button mat-stroked-button type="button" (click)="addSocialMedia()">
                    <mat-icon>add</mat-icon> Thêm MXH
                  </button>
                </div>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Nghề nghiệp</mat-label>
                  <input matInput formControlName="occupation" />
                </mat-form-field>

                <h3>Thông tin xe</h3>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Biển số xe</mat-label>
                  <input matInput formControlName="vehicle_plate" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Màu xe</mat-label>
                  <input matInput formControlName="vehicle_color" />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Loại xe</mat-label>
                  <mat-select formControlName="vehicle_type">
                    <mat-option value="">-- Chọn --</mat-option>
                    <mat-option value="Xăng">Xe xăng</mat-option>
                    <mat-option value="Điện">Xe điện</mat-option>
                    <mat-option value="Khác">Khác</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Hiệu xe</mat-label>
                  <input matInput formControlName="vehicle_brand" placeholder="Honda, Yamaha, ..." />
                </mat-form-field>
              </div>

              <div class="preview-section">
                <h3>Ảnh CCCD</h3>
                @if (tenantService.isLocked()) {
                  <p class="locked">Hồ sơ đã bị khóa. Chỉ admin có thể mở khóa để chỉnh sửa.</p>
                } @else {
                  <div class="upload-row">
                    <div class="upload-box">
                      <span class="label">Mặt trước</span>
                      <input type="file" accept="image/*" (change)="onFileFront($event)" #inputFront />
                      @if (previewFrontUrl()) {
                        <div class="preview-wrap"><img [src]="previewFrontUrl()!" alt="Mặt trước" class="preview-img" [style.transform]="'rotate(' + frontRotation() + 'deg)'" (click)="zoomImage('front', previewFrontUrl()!, 'Mặt trước')" /></div>
                      } @else if (tenantService.tenant()?.id_card_front_url) {
                        @if (signedFrontUrl()) {
                          <div class="preview-wrap"><img [src]="signedFrontUrl()!" alt="Mặt trước" class="preview-img" [style.transform]="'rotate(' + frontRotation() + 'deg)'" (click)="zoomImage('front', signedFrontUrl()!, 'Mặt trước')" /></div>
                        }
                        <button mat-stroked-button type="button" (click)="loadSignedFront()">Tải lại ảnh</button>
                      }
                      @if (uploadingFront()) { <span class="uploading">Đang tải lên...</span> }
                    </div>
                    <div class="upload-box">
                      <span class="label">Mặt sau</span>
                      <input type="file" accept="image/*" (change)="onFileBack($event)" #inputBack />
                      @if (previewBackUrl()) {
                        <div class="preview-wrap"><img [src]="previewBackUrl()!" alt="Mặt sau" class="preview-img" [style.transform]="'rotate(' + backRotation() + 'deg)'" (click)="zoomImage('back', previewBackUrl()!, 'Mặt sau')" /></div>
                      } @else if (tenantService.tenant()?.id_card_back_url) {
                        @if (signedBackUrl()) {
                          <div class="preview-wrap"><img [src]="signedBackUrl()!" alt="Mặt sau" class="preview-img" [style.transform]="'rotate(' + backRotation() + 'deg)'" (click)="zoomImage('back', signedBackUrl()!, 'Mặt sau')" /></div>
                        }
                        <button mat-stroked-button type="button" (click)="loadSignedBack()">Tải lại ảnh</button>
                      }
                      @if (uploadingBack()) { <span class="uploading">Đang tải lên...</span> }
                    </div>
                  </div>
                  <p class="hint">Nhấn vào ảnh để xem phóng to. Dữ liệu form được lưu tạm tự động; nếu thoát hoặc bị đăng xuất, bản nháp sẽ được khôi phục khi quay lại.</p>
                }
              </div>
            </div>
            @if (!tenantService.isLocked()) {
              <button mat-flat-button color="primary" type="submit" [disabled]="saving()" class="submit-btn">
                {{ saving() ? 'Đang lưu...' : 'Lưu thông tin' }}
              </button>
            }
          </form>
        </mat-card-content>
      </mat-card>
    }
  `,
  styles: [`
    .full-width { width: 100%; display: block; }
    .locked { color: #c62828; }
    .error { color: #c62828; margin: 0.5rem 0; }
    .hint { font-size: 0.85rem; color: #666; margin-top: -0.5rem; margin-bottom: 0.5rem; }
    .layout { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; align-items: start; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
    .form-section h3, .preview-section h3 { margin: 0 0 0.5rem 0; }
    .upload-row { display: flex; gap: 1.5rem; flex-wrap: wrap; margin: 0.5rem 0; }
    .upload-box { display: flex; flex-direction: column; gap: 0.5rem; }
    .upload-box .label { font-weight: 500; font-size: 0.9rem; }
    .upload-box input[type="file"] { font-size: 0.9rem; }
    .uploading { font-size: 0.85rem; color: #666; }
    .preview-wrap { width: 200px; height: 140px; display: flex; align-items: center; justify-content: center; border: 1px solid #ddd; border-radius: 4px; overflow: hidden; box-sizing: border-box; background: #fafafa; }
    .preview-wrap .preview-img { max-width: 100%; max-height: 100%; width: auto; height: auto; object-fit: contain; cursor: pointer; display: block; }
    .preview-wrap .preview-img:hover { filter: brightness(0.98); }
    .preview-wrap:has(.preview-img:hover) { border-color: #1976d2; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .submit-btn { margin-top: 1rem; }
    .mxh-section h4 { margin: 0 0 0.5rem 0; font-size: 1rem; }
    .mxh-row { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem; }
    .mxh-type { flex: 0 0 140px; }
    .mxh-value { flex: 1; min-width: 0; }
  `],
})
export class TenantProfileComponent implements OnInit {
  form = this.fb.group({
    id_number: [''],
    full_name: ['', Validators.required],
    dob: [''],
    gender: [''],
    nationality: ['Việt Nam'],
    place_of_origin: [''],
    place_of_residence: [''],
    date_of_issue: [''],
    place_of_issue: [''],
    date_of_expiry: [''],
    phone: [''],
    email: [''],
    social_media: this.fb.array([]),
    occupation: [''],
    vehicle_plate: [''],
    vehicle_color: [''],
    vehicle_type: [''],
    vehicle_brand: [''],
  });
  saving = signal(false);
  uploadingFront = signal(false);
  uploadingBack = signal(false);
  uploadError = signal<string | null>(null);
  previewFrontUrl = signal<string | null>(null);
  previewBackUrl = signal<string | null>(null);
  signedFrontUrl = signal<string | null>(null);
  signedBackUrl = signal<string | null>(null);
  frontRotation = signal(0);
  backRotation = signal(0);

  constructor(
    private readonly fb: FormBuilder,
    private readonly auth: AuthService,
    readonly tenantService: TenantService,
    private readonly dialog: MatDialog,
    private readonly destroyRef: DestroyRef
  ) {}

  socialMediaArray(): FormArray {
    return this.form.get('social_media') as FormArray;
  }

  addSocialMedia(): void {
    this.socialMediaArray().push(this.fb.group({ type: ['facebook'], value: [''] }));
  }

  removeSocialMedia(index: number): void {
    this.socialMediaArray().removeAt(index);
  }

  mxhLabel(index: number): string {
    const type = this.socialMediaArray().at(index)?.get('type')?.value;
    if (type === 'facebook') return 'URL Facebook';
    if (type === 'zalo') return 'Số điện thoại Zalo';
    return 'Liên kết hoặc mô tả';
  }

  mxhPlaceholder(index: number): string {
    const type = this.socialMediaArray().at(index)?.get('type')?.value;
    if (type === 'facebook') return 'https://facebook.com/...';
    if (type === 'zalo') return '0912345678';
    return 'URL hoặc tên hiển thị';
  }

  private getSocialMediaForOcr(): SocialMediaEntry[] | undefined {
    const raw = this.form.getRawValue().social_media as { type?: string; value?: string }[] | undefined;
    if (!Array.isArray(raw)) return undefined;
    const list = raw
      .filter(e => e?.value != null && String(e.value).trim() !== '')
      .map(e => ({ type: (e.type === 'facebook' || e.type === 'zalo' || e.type === 'other' ? e.type : 'other') as SocialMediaType, value: String(e.value).trim() }));
    return list.length ? list : undefined;
  }

  ngOnInit(): void {
    const contractId = this.auth.contractId();
    if (contractId) {
      this.tenantService.loadTenantByContract(contractId).then(() => {
        this.patchForm();
        this.restoreDraft(contractId);
        this.loadSignedFront();
        this.loadSignedBack();
      });
      this.form.valueChanges.pipe(debounceTime(500), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
        this.saveDraft(contractId);
      });
    }
  }

  private getDraftKey(contractId: string): string {
    return DRAFT_KEY_PREFIX + contractId;
  }

  private saveDraft(contractId: string): void {
    try {
      const value = this.form.getRawValue();
      localStorage.setItem(this.getDraftKey(contractId), JSON.stringify(value));
    } catch {
      // ignore quota / private mode
    }
  }

  private restoreDraft(contractId: string): void {
    try {
      const raw = localStorage.getItem(this.getDraftKey(contractId));
      if (raw) {
        const value = JSON.parse(raw) as Record<string, unknown>;
        if (value && typeof value === 'object') {
          const { social_media, ...rest } = value;
          this.form.patchValue(rest as Record<string, string>, { emitEvent: false });
          if (Array.isArray(social_media)) {
            const arr = this.socialMediaArray();
            arr.clear();
            for (const e of social_media) {
              const t = (e && typeof e === 'object' && 'type' in e) ? (e as { type: string; value: string }).type : 'other';
              const v = (e && typeof e === 'object' && 'value' in e) ? (e as { type: string; value: string }).value : '';
              arr.push(this.fb.group({ type: [t], value: [v ?? ''] }));
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  private clearDraft(contractId: string): void {
    try {
      localStorage.removeItem(this.getDraftKey(contractId));
    } catch {}
  }

  private patchForm(): void {
    const t = this.tenantService.tenant();
    if (!t) return;
    const ocr = (t.ocr_data ?? {}) as OcrData;
    this.form.patchValue({
      id_number: t.id_number ?? '',
      full_name: t.full_name,
      dob: ocr.dob ?? '',
      gender: ocr.gender ?? '',
      nationality: ocr.nationality ?? 'Việt Nam',
      place_of_origin: ocr.place_of_origin ?? '',
      place_of_residence: ocr.place_of_residence ?? '',
      date_of_issue: ocr.date_of_issue ?? '',
      place_of_issue: ocr.place_of_issue ?? '',
      date_of_expiry: ocr.date_of_expiry ?? '',
      phone: ocr.phone ?? '',
      email: ocr.email ?? '',
      occupation: ocr.occupation ?? '',
      vehicle_plate: ocr.vehicle_plate ?? '',
      vehicle_color: ocr.vehicle_color ?? '',
      vehicle_type: ocr.vehicle_type ?? '',
      vehicle_brand: ocr.vehicle_brand ?? '',
    });
    const arr = this.socialMediaArray();
    arr.clear();
    const entries = ocr.social_media;
    if (Array.isArray(entries) && entries.length) {
      for (const e of entries) {
        const type = (e?.type === 'facebook' || e?.type === 'zalo' || e?.type === 'other') ? e.type : 'other';
        arr.push(this.fb.group({ type: [type], value: [e?.value ?? ''] }));
      }
    } else {
      const legacy = ocr.social_media as string | undefined;
      if (typeof legacy === 'string' && legacy.trim()) {
        arr.push(this.fb.group({ type: ['other'], value: [legacy.trim()] }));
      }
    }
    const r0 = [0, 90, 180, 270].includes(Number(ocr.id_card_front_rotation)) ? Number(ocr.id_card_front_rotation) : 0;
    const r1 = [0, 90, 180, 270].includes(Number(ocr.id_card_back_rotation)) ? Number(ocr.id_card_back_rotation) : 0;
    this.frontRotation.set(r0);
    this.backRotation.set(r1);
  }

  buildOcrData(): OcrData | null {
    const t = this.tenantService.tenant();
    const existing = (t?.ocr_data ?? {}) as OcrData;
    const v = this.form.getRawValue();
    const ocr: OcrData = {
      ...existing,
      id_number: v.id_number || undefined,
      full_name: v.full_name || undefined,
      dob: v.dob || undefined,
      gender: v.gender || undefined,
      nationality: v.nationality || undefined,
      place_of_origin: v.place_of_origin || undefined,
      place_of_residence: v.place_of_residence || undefined,
      date_of_issue: v.date_of_issue || undefined,
      place_of_issue: v.place_of_issue || undefined,
      date_of_expiry: v.date_of_expiry || undefined,
      id_card_front_rotation: this.frontRotation(),
      id_card_back_rotation: this.backRotation(),
      phone: v.phone || undefined,
      email: v.email || undefined,
      social_media: this.getSocialMediaForOcr(),
      occupation: v.occupation || undefined,
      vehicle_plate: v.vehicle_plate || undefined,
      vehicle_color: v.vehicle_color || undefined,
      vehicle_type: v.vehicle_type || undefined,
      vehicle_brand: v.vehicle_brand || undefined,
    };
    const hasAny = Object.keys(ocr).some(k => ocr[k] !== undefined && ocr[k] !== '');
    return hasAny ? ocr : null;
  }

  async onSubmit(): Promise<void> {
    const t = this.tenantService.tenant();
    if (!t || this.tenantService.isLocked()) return;
    this.uploadError.set(null);
    this.saving.set(true);
    const v = this.form.getRawValue();
    const contractId = this.auth.contractId();
    const { error } = await this.tenantService.updateTenant(t.id, {
      full_name: v.full_name ?? '',
      id_number: v.id_number || null,
      ocr_data: this.buildOcrData(),
    });
    this.saving.set(false);
    if (error) {
      this.uploadError.set('Lưu thông tin thất bại: ' + error);
    } else if (contractId) {
      this.clearDraft(contractId);
    }
  }

  zoomImage(side: CccdZoomSide, url: string, label: string): void {
    const t = this.tenantService.tenant();
    if (!t) return;
    const initialRotation = side === 'front' ? this.frontRotation() : this.backRotation();
    this.dialog.open(CccdZoomDialogComponent, {
      data: {
        imageUrl: url,
        label,
        side,
        tenantId: t.id,
        initialRotation,
        onRotationChange: (s, degrees) => this.saveRotation(s, degrees),
      } as CccdZoomData,
      maxWidth: '95vw',
      maxHeight: '95vh',
    });
  }

  async saveRotation(side: CccdZoomSide, degrees: number): Promise<void> {
    if (side === 'front') this.frontRotation.set(degrees);
    else this.backRotation.set(degrees);
    const t = this.tenantService.tenant();
    if (!t) return;
    const existing = (t.ocr_data ?? {}) as OcrData;
    const ocr: OcrData = {
      ...existing,
      id_card_front_rotation: side === 'front' ? degrees : (existing.id_card_front_rotation ?? 0),
      id_card_back_rotation: side === 'back' ? degrees : (existing.id_card_back_rotation ?? 0),
    };
    await this.tenantService.updateTenant(t.id, { ocr_data: ocr });
  }

  async onFileFront(event: Event): Promise<void> {
    const t = this.tenantService.tenant();
    if (!t || this.tenantService.isLocked()) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadError.set(null);
    const prevUrl = this.previewFrontUrl();
    if (prevUrl) URL.revokeObjectURL(prevUrl);
    this.previewFrontUrl.set(URL.createObjectURL(file));
    this.signedFrontUrl.set(null);
    this.uploadingFront.set(true);
    const { path, error } = await this.tenantService.uploadIdCard(t.id, file, 'front');
    if (error) {
      this.uploadingFront.set(false);
      this.uploadError.set('Tải ảnh lên thất bại: ' + error);
      input.value = '';
      return;
    }
    const contractId = this.auth.contractId();
    if (path) {
      const { error: updateErr } = await this.tenantService.updateTenant(t.id, { id_card_front_url: path });
      if (updateErr) {
        this.uploadError.set('Lưu đường dẫn ảnh thất bại: ' + updateErr);
      } else if (contractId) {
        await this.tenantService.reloadTenantByContract(contractId);
        const { url } = await this.tenantService.getSignedUrl(path);
        if (url) this.signedFrontUrl.set(url);
      }
    }
    const u = this.previewFrontUrl();
    if (u) URL.revokeObjectURL(u);
    this.previewFrontUrl.set(null);
    this.uploadingFront.set(false);
    input.value = '';
  }

  async onFileBack(event: Event): Promise<void> {
    const t = this.tenantService.tenant();
    if (!t || this.tenantService.isLocked()) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.uploadError.set(null);
    const prevUrl = this.previewBackUrl();
    if (prevUrl) URL.revokeObjectURL(prevUrl);
    this.previewBackUrl.set(URL.createObjectURL(file));
    this.signedBackUrl.set(null);
    this.uploadingBack.set(true);
    const { path, error } = await this.tenantService.uploadIdCard(t.id, file, 'back');
    if (error) {
      this.uploadingBack.set(false);
      this.uploadError.set('Tải ảnh lên thất bại: ' + error);
      input.value = '';
      return;
    }
    const contractId = this.auth.contractId();
    if (path) {
      const { error: updateErr } = await this.tenantService.updateTenant(t.id, { id_card_back_url: path });
      if (updateErr) {
        this.uploadError.set('Lưu đường dẫn ảnh thất bại: ' + updateErr);
      } else if (contractId) {
        await this.tenantService.reloadTenantByContract(contractId);
        const { url } = await this.tenantService.getSignedUrl(path);
        if (url) this.signedBackUrl.set(url);
      }
    }
    const u = this.previewBackUrl();
    if (u) URL.revokeObjectURL(u);
    this.previewBackUrl.set(null);
    this.uploadingBack.set(false);
    input.value = '';
  }

  async loadSignedFront(): Promise<void> {
    const path = this.tenantService.tenant()?.id_card_front_url;
    if (!path) return;
    const { url } = await this.tenantService.getSignedUrl(path);
    this.signedFrontUrl.set(url ?? null);
  }

  async loadSignedBack(): Promise<void> {
    const path = this.tenantService.tenant()?.id_card_back_url;
    if (!path) return;
    const { url } = await this.tenantService.getSignedUrl(path);
    this.signedBackUrl.set(url ?? null);
  }
}
