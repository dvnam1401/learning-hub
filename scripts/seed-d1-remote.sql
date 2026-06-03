INSERT OR REPLACE INTO users (id, username, password_hash, role, status, display_name)
VALUES (
  '8ad9a801-be90-4554-a0c0-274bed3b748e',
  'admin',
  '$2b$10$9dqx15oMmulXA03vV8FLf.GmYNxgPXikyWkZeIKz3ARLIl93Wd1v6',
  'ADMIN',
  'active',
  'Administrator'
);

INSERT OR REPLACE INTO users (id, username, password_hash, role, status, display_name)
VALUES (
  '307aef02-716c-447c-aa57-e41d59254ad0',
  'student',
  '$2b$10$yrxu/qs9mt9l6Pi1dMp2NOYnpWbzKOkic9NkF00keo20fT5GuWyHi',
  'USER',
  'active',
  'Học viên Demo'
);
