create table "user"
(
    id           bigserial
        primary key,
    name         varchar(100) not null,
    email        varchar(255) not null
        unique,
    password     varchar(255) not null,
    phone_number varchar(20),
    timezone     varchar(50) default 'Asia/Kuala_Lumpur'::character varying,
    created_at   timestamp   default CURRENT_TIMESTAMP
);


