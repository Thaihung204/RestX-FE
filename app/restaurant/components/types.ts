export enum ReservationStep {
    SEARCH = 'SEARCH',
    TABLE_SELECTION = 'TABLE_SELECTION',
    CONFIRMATION = 'CONFIRMATION',
    SUCCESS = 'SUCCESS'
}

export interface BookingData {
    date: string;
    time: string;
    guests: number;
}

export enum TableStatus {
    Available = 0,
    Reserved = 1,
    Occupied = 2
}

export interface Table {
    id: string;
    label: string;
    capacity: number;
    isOccupied: boolean;
    isPremium: boolean;
    zone: string;
    x: number;
    y: number;
    width: number;
    height: number;
    shape: 'Round' | 'Rectangle';
    rotation: number;
}

export interface UserDetails {
    name: string;
    phone: string;
    email: string;
    requests: string;
}
