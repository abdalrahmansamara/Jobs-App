drop table if exists jobs;
create table jobs(
    id serial primary key,
    title varchar(255),
    company varchar(255),
    location text,
    url text,
    description text
);