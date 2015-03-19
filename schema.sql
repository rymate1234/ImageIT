drop table if exists images;
create table entries (
  id integer primary key autoincrement,
  file_name text not null,
  title text,
  file_ext text not null
);
