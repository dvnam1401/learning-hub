"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import type { ModalKind, UserForm, UserRow } from "./admin-user-types";

interface Props {
  modal: ModalKind;
  selected: UserRow | null;
  form: UserForm;
  newPassword: string;
  confirmPassword: string;
  error: string;
  loading: boolean;
  onClose: () => void;
  onFormChange: (form: UserForm) => void;
  onNewPasswordChange: (v: string) => void;
  onConfirmPasswordChange: (v: string) => void;
  onCreate: (e: React.FormEvent) => void;
  onEdit: (e: React.FormEvent) => void;
  onReset: (e: React.FormEvent) => void;
  onDelete: () => void;
}

function UserFields({
  form,
  modal,
  onFormChange,
}: {
  form: UserForm;
  modal: ModalKind;
  onFormChange: (form: UserForm) => void;
}) {
  return (
    <>
      <Input
        placeholder="Username"
        value={form.username}
        onChange={(e) => onFormChange({ ...form, username: e.target.value })}
        required
      />
      {modal === "create" && (
        <Input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => onFormChange({ ...form, password: e.target.value })}
          required
        />
      )}
      <Input
        placeholder="Tên hiển thị"
        value={form.displayName}
        onChange={(e) => onFormChange({ ...form, displayName: e.target.value })}
      />
      <div>
        <label className="mb-1.5 block text-sm font-medium text-muted">
          Vai trò
        </label>
        <Select
          value={form.role}
          onChange={(e) => onFormChange({ ...form, role: e.target.value })}
        >
          <option value="USER">Người dùng (USER)</option>
          <option value="ADMIN">Quản trị (ADMIN)</option>
        </Select>
      </div>
    </>
  );
}

function FormActions({
  loading,
  onClose,
  submitLabel,
}: {
  loading: boolean;
  onClose: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="secondary" onClick={onClose}>
        Hủy
      </Button>
      <Button type="submit" disabled={loading}>
        {loading ? "Đang lưu..." : submitLabel}
      </Button>
    </div>
  );
}

export function AdminUserModals({
  modal,
  selected,
  form,
  newPassword,
  confirmPassword,
  error,
  loading,
  onClose,
  onFormChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onCreate,
  onEdit,
  onReset,
  onDelete,
}: Props) {
  return (
    <>
      <Modal open={modal === "create"} onClose={onClose} title="Tạo User mới">
        <form onSubmit={onCreate} className="space-y-4">
          <UserFields form={form} modal={modal} onFormChange={onFormChange} />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <FormActions loading={loading} onClose={onClose} submitLabel="Lưu" />
        </form>
      </Modal>

      <Modal
        open={modal === "edit"}
        onClose={onClose}
        title={`Chỉnh sửa: ${selected?.username ?? ""}`}
      >
        <form onSubmit={onEdit} className="space-y-4">
          <UserFields form={form} modal={modal} onFormChange={onFormChange} />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <FormActions loading={loading} onClose={onClose} submitLabel="Cập nhật" />
        </form>
      </Modal>

      <Modal
        open={modal === "reset"}
        onClose={onClose}
        title={`Reset mật khẩu: ${selected?.username ?? ""}`}
      >
        <form onSubmit={onReset} className="space-y-4">
          <Input
            type="password"
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
            required
          />
          <Input
            type="password"
            placeholder="Xác nhận mật khẩu"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            required
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <FormActions loading={loading} onClose={onClose} submitLabel="Reset" />
        </form>
      </Modal>

      <Modal open={modal === "delete"} onClose={onClose} title="Xóa tài khoản">
        <p className="text-sm text-muted">
          Bạn có chắc muốn xóa tài khoản{" "}
          <span className="font-semibold text-foreground">
            {selected?.username}
          </span>
          ? Hành động này không thể hoàn tác.
        </p>
        {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={loading}
            onClick={onDelete}
          >
            {loading ? "Đang xóa..." : "Xóa"}
          </Button>
        </div>
      </Modal>
    </>
  );
}
