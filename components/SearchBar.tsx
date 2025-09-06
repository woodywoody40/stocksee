
import React, { useState } from 'react';

interface SearchBarProps {
    onSearch: (term: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
    const [input, setInput] = useState('');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(input.trim());
    };

    return (
        <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
                 <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-text-light-secondary dark:text-text-dark-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </div>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="輸入股票代號或名稱搜尋 (例如: 2330 或 台積電)"
                    className="w-full pl-12 pr-24 py-3 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/80 focus:border-transparent transition-colors shadow-sm dark:text-text-dark-primary dark:placeholder-text-dark-secondary"
                />
                 <button
                    type="submit"
                    className="absolute inset-y-0 right-2 my-1.5 px-5 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-lg text-sm font-semibold transition-colors transform hover:scale-105"
                    aria-label="搜尋"
                >
                    搜尋
                </button>
            </div>
        </form>
    );
};

export default SearchBar;