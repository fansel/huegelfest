export interface User {
    username: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
    group: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface Group {
    name: string;
    description: string;
    permissions: string[];
    createdAt: Date;
    updatedAt: Date;
}

export interface Timeline {
    title: string;
    content: string;
    type: 'announcement' | 'event' | 'news';
    createdAt: Date;
    updatedAt: Date;
}

export interface Category {
    name: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}

export type CollectionName = 'users' | 'groups' | 'timeline' | 'categories'; 