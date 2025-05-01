import { User, Group, Timeline, Category } from '../types';

export const defaultGroups: Group[] = [
    {
        name: 'Admin',
        description: 'Administrator Gruppe',
        permissions: ['admin'],
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'User',
        description: 'Standard Benutzergruppe',
        permissions: ['read', 'write'],
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

export const defaultUsers: User[] = [
    {
        username: 'admin',
        email: 'admin@huegelfest.de',
        password: '$2b$10$YourHashedPasswordHere', // Wird beim ersten Login geändert
        role: 'admin',
        group: 'Admin',
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

export const defaultTimeline: Timeline[] = [
    {
        title: 'Willkommen beim Hügelfest',
        content: 'Das Hügelfest ist eröffnet!',
        type: 'announcement',
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

export const defaultCategories: Category[] = [
    {
        name: 'Getränke',
        description: 'Alle Getränke',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Essen',
        description: 'Alle Speisen',
        createdAt: new Date(),
        updatedAt: new Date()
    },
    {
        name: 'Merchandise',
        description: 'Hügelfest Merchandise',
        createdAt: new Date(),
        updatedAt: new Date()
    }
]; 