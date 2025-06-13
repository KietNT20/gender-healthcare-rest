// src/common/pagination/interface/paginated.interface.ts
export interface Paginated<T> {
    data: T[];
    meta: {
        itemsPerPage: number;
        totalItems: number;
        currentPage: number;
        totalPages: number;
    };
}
