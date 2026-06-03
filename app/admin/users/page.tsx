"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";

interface UserRow {
  id: string;
  username: string;
  role: string;
  status: string;
  display_name: string | null;
  courseCount: number;
}

const emptyForm = {
  username: "",
  password: "",
  role: "USER",
  displayName: "",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function load() {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []));
  }

  useEffect(() => {
    load();
  }, []);

  function closeForm() {
    setShowForm(false);
    setForm(emptyForm);
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    closeForm();
    load();
  }

  async function toggleLock(u: UserRow) {
    await fetch(`/api/admin/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: u.status === "active" ? "locked" : "active",
      }),
    });
    load();
  }

  async function resetPw(id: string) {
    const pw = prompt("Mật khẩu mới:");
    if (!pw) return;
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pw }),
    });
    alert("Đã reset mật khẩu");
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý User</h1>
        <Button onClick={() => setShowForm(true)}>Tạo User</Button>
      </div>

      <Modal open={showForm} onClose={closeForm} title="Tạo User mới">
        <form onSubmit={createUser} className="space-y-4">
          <Input
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <Input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <Input
            placeholder="Tên hiển thị"
            value={form.displayName}
            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-600">
              Vai trò
            </label>
            <Select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="USER">Người dùng (USER)</option>
              <option value="ADMIN">Quản trị (ADMIN)</option>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={closeForm}>
              Hủy
            </Button>
            <Button type="submit">Lưu</Button>
          </div>
        </form>
      </Modal>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b bg-slate-50">
            <tr>
              <th className="p-3">Username</th>
              <th className="p-3">Role</th>
              <th className="p-3">Status</th>
              <th className="p-3">Khóa học</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b">
                <td className="p-3 font-medium">{u.username}</td>
                <td className="p-3">{u.role}</td>
                <td className="p-3">
                  <Badge tone={u.status === "active" ? "green" : "red"}>
                    {u.status}
                  </Badge>
                </td>
                <td className="p-3">{u.courseCount}</td>
                <td className="p-3 flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => toggleLock(u)}
                  >
                    {u.status === "active" ? "Khóa" : "Mở"}
                  </Button>
                  <Button variant="ghost" onClick={() => resetPw(u.id)}>
                    Reset PW
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
