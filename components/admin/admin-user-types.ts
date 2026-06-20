export interface UserRow {
  id: string;
  username: string;
  role: string;
  status: string;
  display_name: string | null;
  courseCount: number;
}

export type ModalKind = "create" | "edit" | "reset" | "delete" | null;

export interface UserForm {
  username: string;
  password: string;
  role: string;
  displayName: string;
}

export const emptyUserForm: UserForm = {
  username: "",
  password: "",
  role: "USER",
  displayName: "",
};

export async function apiJson(url: string, init?: RequestInit) {
  const res = await fetch(url, init);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? "Có lỗi xảy ra");
  return data;
}
