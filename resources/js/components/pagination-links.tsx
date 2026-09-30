import React from 'react';
import { Link } from '@inertiajs/react';
import { PaginationLink } from '@/types';

export function PaginationLinks({ links }: { links: PaginationLink[] }) {
    if (links.length < 4) return null;

    return (
        <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5 pt-4">
            {links.map((link, index) => {
                const classes = `rounded-lg border px-3 py-2 text-xs font-semibold ${link.active ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'} ${!link.url ? 'pointer-events-none opacity-40' : ''}`;
                return link.url ? (
                    <Link key={`${link.label}-${index}`} href={link.url} preserveScroll className={classes} aria-current={link.active ? 'page' : undefined}>
                        {link.label}
                    </Link>
                ) : (
                    <span key={`${link.label}-${index}`} className={classes}>{link.label}</span>
                );
            })}
        </nav>
    );
}