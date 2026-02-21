import { Component, Inject, OnInit, signal } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { TenantService } from '../../../core/services/tenant.service';
import type { Tenant, OcrData, SocialMediaType } from '../../../core/services/tenant.service';

export interface TenantProfileDialogData {
  tenant: Tenant;
}

@Component({
  selector: 'app-tenant-profile-dialog',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatIconModule,
  ],
  template: `
    <h2 mat-dialog-title>Hồ sơ: {{ data.tenant.full_name }}</h2>
    <mat-dialog-content class="profile-dialog-content">
      @if (error()) {
        <p class="error">{{ error() }}</p>
      }
      <div class="lock-row">
        <mat-slide-toggle [checked]="isLocked()" (change)="onLockChange($event.checked)" color="primary">
          Khóa sửa (khách không chỉnh được hồ sơ)
        </mat-slide-toggle>
      </div>
      <form [formGroup]="form">
        <h3>Thông tin CCCD</h3>
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
          <input matInput formControlName="dob" />
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
          <input matInput formControlName="nationality" />
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
          <mat-label>Ngày cấp / Nơi cấp / Ngày hết hạn</mat-label>
          <input matInput formControlName="date_of_issue" placeholder="Ngày cấp" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <input matInput formControlName="place_of_issue" placeholder="Nơi cấp" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <input matInput formControlName="date_of_expiry" placeholder="Ngày hết hạn" />
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
        <div class="mxh-section" formArrayName="social_media">
          <h4>MXH</h4>
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
                <mat-label>Giá trị</mat-label>
                <input matInput formControlName="value" />
              </mat-form-field>
              <button mat-icon-button type="button" (click)="removeSocialMedia($index)"><mat-icon>close</mat-icon></button>
            </div>
          }
          <button mat-stroked-button type="button" (click)="addSocialMedia()"><mat-icon>add</mat-icon> Thêm MXH</button>
        </div>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Nghề nghiệp</mat-label>
          <input matInput formControlName="occupation" />
        </mat-form-field>

        <h3>Thông tin xe</h3>
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Biển số / Màu / Loại / Hiệu</mat-label>
          <input matInput formControlName="vehicle_plate" placeholder="Biển số" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <input matInput formControlName="vehicle_color" placeholder="Màu xe" />
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <mat-select formControlName="vehicle_type" placeholder="Loại xe">
            <mat-option value="">-- Chọn --</mat-option>
            <mat-option value="Xăng">Xe xăng</mat-option>
            <mat-option value="Điện">Xe điện</mat-option>
            <mat-option value="Khác">Khác</mat-option>
          </mat-select>
        </mat-form-field>
        <mat-form-field appearance="outline" class="full-width">
          <input matInput formControlName="vehicle_brand" placeholder="Hiệu xe" />
        </mat-form-field>

        <h3>Ảnh CCCD</h3>
        <p class="hint">Admin có thể tải ảnh CCCD thay cho khách nếu khách chưa biết dùng ứng dụng.</p>
        <div class="cccd-preview">
          <div class="cccd-box">
            <span>Mặt trước</span>
            <input type="file" accept="image/*" (change)="onFileFront($event)" class="file-input" />
            @if (signedFrontUrl()) {
              <img [src]="signedFrontUrl()!" alt="Mặt trước" class="cccd-img" [style.transform]="'rotate(' + frontRotation() + 'deg)'" />
            } @else if (data.tenant.id_card_front_url) {
              <p class="loading">Đang tải ảnh...</p>
            } @else {
              <p class="no-img">Chưa có ảnh</p>
            }
            @if (uploadingFront()) { <span class="uploading">Đang tải lên...</span> }
          </div>
          <div class="cccd-box">
            <span>Mặt sau</span>
            <input type="file" accept="image/*" (change)="onFileBack($event)" class="file-input" />
            @if (signedBackUrl()) {
              <img [src]="signedBackUrl()!" alt="Mặt sau" class="cccd-img" [style.transform]="'rotate(' + backRotation() + 'deg)'" />
            } @else if (data.tenant.id_card_back_url) {
              <p class="loading">Đang tải ảnh...</p>
            } @else {
              <p class="no-img">Chưa có ảnh</p>
            }
            @if (uploadingBack()) { <span class="uploading">Đang tải lên...</span> }
          </div>
        </div>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Đóng</button>
      <button mat-raised-button color="primary" (click)="save()" [disabled]="saving() || form.invalid">
        {{ saving() ? 'Đang lưu...' : 'Lưu thay đổi' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .profile-dialog-content { max-height: 75vh; overflow-y: auto; min-width: 360px; }
    .full-width { width: 100%; display: block; }
    .error { color: #c62828; }
    .lock-row { margin-bottom: 1rem; }
    h3 { margin: 1rem 0 0.5rem 0; font-size: 1rem; }
    h4 { margin: 0.5rem 0; font-size: 0.95rem; }
    .mxh-section .mxh-row { display: flex; align-items: flex-start; gap: 0.5rem; margin-bottom: 0.5rem; }
    .mxh-type { flex: 0 0 120px; }
    .mxh-value { flex: 1; min-width: 0; }
    .hint { font-size: 0.85rem; color: #666; margin: 0.5rem 0 0 0; }
    .cccd-preview { display: flex; gap: 1rem; flex-wrap: wrap; margin: 0.5rem 0; }
    .cccd-box { width: 200px; min-height: 140px; border: 1px solid #ddd; border-radius: 8px; padding: 8px; display: flex; flex-direction: column; align-items: center; }
    .cccd-box span { font-weight: 500; margin-bottom: 4px; }
    .file-input { font-size: 0.8rem; margin-bottom: 4px; max-width: 100%; }
    .cccd-img { max-width: 100%; max-height: 140px; object-fit: contain; }
    .loading, .no-img { font-size: 0.85rem; color: #666; margin: 0.5rem 0; }
    .uploading { font-size: 0.8rem; color: #1976d2; margin-top: 4px; }
  `],
})
export class TenantProfileDialogComponent implements OnInit {
  form: FormGroup;
  saving = signal(false);
  error = signal<string | null>(null);
  isLocked = signal(false);
  signedFrontUrl = signal<string | null>(null);
  signedBackUrl = signal<string | null>(null);
  frontRotation = signal(0);
  backRotation = signal(0);
  uploadingFront = signal(false);
  uploadingBack = signal(false);

  constructor(
    private readonly fb: FormBuilder,
    @Inject(MAT_DIALOG_DATA) public data: TenantProfileDialogData,
    private readonly dialogRef: MatDialogRef<TenantProfileDialogComponent>,
    private readonly tenantService: TenantService,
  ) {
    this.form = this.fb.group({
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
  }

  socialMediaArray(): FormArray {
    return this.form.get('social_media') as FormArray;
  }

  addSocialMedia(): void {
    this.socialMediaArray().push(this.fb.group({ type: ['facebook'], value: [''] }));
  }

  removeSocialMedia(index: number): void {
    this.socialMediaArray().removeAt(index);
  }

  ngOnInit(): void {
    this.patchForm(this.data.tenant);
    this.isLocked.set(this.data.tenant.is_locked);
    this.loadSignedUrls();
  }

  private patchForm(t: Tenant): void {
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
    this.frontRotation.set([0, 90, 180, 270].includes(Number(ocr.id_card_front_rotation)) ? Number(ocr.id_card_front_rotation) : 0);
    this.backRotation.set([0, 90, 180, 270].includes(Number(ocr.id_card_back_rotation)) ? Number(ocr.id_card_back_rotation) : 0);
  }

  private async loadSignedUrls(): Promise<void> {
    const t = this.data.tenant;
    if (t.id_card_front_url) {
      const { url } = await this.tenantService.getSignedUrl(t.id_card_front_url);
      this.signedFrontUrl.set(url ?? null);
    }
    if (t.id_card_back_url) {
      const { url } = await this.tenantService.getSignedUrl(t.id_card_back_url);
      this.signedBackUrl.set(url ?? null);
    }
  }

  async onFileFront(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.error.set(null);
    this.uploadingFront.set(true);
    const { path, error: uploadErr } = await this.tenantService.uploadIdCard(this.data.tenant.id, file, 'front');
    if (uploadErr) {
      this.error.set('Tải ảnh mặt trước thất bại: ' + uploadErr);
      this.uploadingFront.set(false);
      input.value = '';
      return;
    }
    if (path) {
      const { error: updateErr } = await this.tenantService.updateTenant(this.data.tenant.id, { id_card_front_url: path });
      if (updateErr) this.error.set('Lưu đường dẫn ảnh thất bại: ' + updateErr);
      else {
        this.data.tenant = { ...this.data.tenant, id_card_front_url: path };
        await this.loadSignedUrls();
      }
    }
    this.uploadingFront.set(false);
    input.value = '';
  }

  async onFileBack(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.error.set(null);
    this.uploadingBack.set(true);
    const { path, error: uploadErr } = await this.tenantService.uploadIdCard(this.data.tenant.id, file, 'back');
    if (uploadErr) {
      this.error.set('Tải ảnh mặt sau thất bại: ' + uploadErr);
      this.uploadingBack.set(false);
      input.value = '';
      return;
    }
    if (path) {
      const { error: updateErr } = await this.tenantService.updateTenant(this.data.tenant.id, { id_card_back_url: path });
      if (updateErr) this.error.set('Lưu đường dẫn ảnh thất bại: ' + updateErr);
      else {
        this.data.tenant = { ...this.data.tenant, id_card_back_url: path };
        await this.loadSignedUrls();
      }
    }
    this.uploadingBack.set(false);
    input.value = '';
  }

  private buildOcrData(): OcrData {
    const t = this.data.tenant;
    const existing = (t?.ocr_data ?? {}) as OcrData;
    const v = this.form.getRawValue();
    const raw = v.social_media as { type?: string; value?: string }[] | undefined;
    const list = Array.isArray(raw)
      ? raw
          .filter(e => e?.value != null && String(e.value).trim() !== '')
          .map(e => ({ type: (e.type === 'facebook' || e.type === 'zalo' || e.type === 'other' ? e.type : 'other') as SocialMediaType, value: String(e.value).trim() }))
      : [];
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
      social_media: list.length ? list : undefined,
      occupation: v.occupation || undefined,
      vehicle_plate: v.vehicle_plate || undefined,
      vehicle_color: v.vehicle_color || undefined,
      vehicle_type: v.vehicle_type || undefined,
      vehicle_brand: v.vehicle_brand || undefined,
    };
    return ocr;
  }

  async onLockChange(locked: boolean): Promise<void> {
    const { error } = await this.tenantService.setLock(this.data.tenant.id, locked);
    if (error) {
      this.error.set(error);
    } else {
      this.isLocked.set(locked);
      this.data.tenant = { ...this.data.tenant, is_locked: locked };
    }
  }

  async save(): Promise<void> {
    this.error.set(null);
    this.saving.set(true);
    const v = this.form.getRawValue();
    const { error } = await this.tenantService.updateTenant(this.data.tenant.id, {
      full_name: v.full_name ?? '',
      id_number: v.id_number || null,
      ocr_data: this.buildOcrData(),
    });
    this.saving.set(false);
    if (error) {
      this.error.set('Lưu thất bại: ' + error);
    } else {
      this.dialogRef.close(true);
    }
  }
}
