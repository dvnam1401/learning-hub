"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AdminUserModals } from "./AdminUserModals";
import {
  apiJson,
  emptyUserForm,
  type ModalKind,
  type UserForm,
  type UserRow,
} from "./admin-user-types";

export function AdminUsersClient() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [modal, setModal] = useState<ModalKind>(null);
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [form, setForm] = useState<UserForm>(emptyUserForm);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function load() {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  function closeModal() {
    setModal(null);
    setSelected(null);
    setForm(emptyUserForm);
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  }

  function openCreate() {
    setForm(emptyUserForm);
    setError("");
    setModal("create");
  }

  function openEdit(u: UserRow) {
    setSelected(u);
    setForm({
      username: u.username,
      password: "",
      role: u.role,
      displayName: u.display_name ?? "",
    });
    setError("");
    setModal("edit");
  }

  function openReset(u: UserRow) {
    setSelected(u);
    setNewPassword("");
    setConfirmPassword("");
    setError("");
    setModal("reset");
  }

  function openDelete(u: UserRow) {
    setSelected(u);
    setError("");
    setModal("delete");
  }

  async function runAction(action: () => Promise<void>) {
    setLoading(true);
    setError("");
    try {
      await action();
      closeModal();
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    await runAction(() =>
      apiJson("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
    );
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    await runAction(() =>
      apiJson(`/api/admin/users/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: form.username,
          displayName: form.displayName || null,
          role: form.role,
        }),
      })
    );
  }

  async function toggleLock(u: UserRow) {
    const next = u.status === "active" ? "locked" : "active";
    const label = next === "locked" ? "khóa" : "mở khóa";
    if (!confirm(`Xác nhận ${label} tài khoản "${u.username}"?`)) return;
    try {
      await apiJson(`/api/admin/users/${u.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Có lỗi xảy ra");
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!selected) return;
    if (newPassword.length < 6) {
      setError("Mật khẩu tối thiểu 6 ký tự");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    await runAction(() =>
      apiJson(`/api/admin/users/${selected.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      })
    );
  }

  async function deleteUser() {
    if (!selected) return;
    await runAction(() =>
      apiJson(`/api/admin/users/${selected.id}`, { method: "DELETE" })
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý User</h1>
        <Button onClick={openCreate}>Tạo User</Button>
      </div>

      <AdminUserModals
        modal={modal}
        selected={selected}
        form={form}
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        error={error}
        loading={loading}
        onClose={closeModal}
        onFormChange={setForm}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
        onCreate={createUser}
        onEdit={saveEdit}
        onReset={resetPassword}
        onDelete={deleteUser}
      />

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="p-3">Username</th>
              <th className="p-3">Tên hiển thị</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Khóa học</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-500">
                  Chưa có người dùng nào
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="p-3 font-medium">{u.username}</td>
                <td className="p-3 text-slate-600">
                  {u.display_name || "—"}
                </td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">
                  <Badge tone={u.status === "active" ? "green" : "red"}>
                    {u.status}
                  </Badge>
                </td>
                <td className="p-3">{u.courseCount}</td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={() => openEdit(u)}>
                      Sửa
                    </Button>
                    <Button variant="secondary" onClick={() => toggleLock(u)}>
                      {u.status === "active" ? "Khóa" : "Mở khóa"}
                    </Button>
                    <Button variant="ghost" onClick={() => openReset(u)}>
                      Reset PW
                    </Button>
                    <Button variant="danger" onClick={() => openDelete(u)}>
                      Xóa
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
