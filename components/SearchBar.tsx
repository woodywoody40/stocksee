
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface StockListItem {
    code: string; 
    name: string; 
    alias?: string[];
}

interface SearchBarProps {
    stockList: StockListItem[];
    onSearch: (term: string) => void;
}

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = ({ className, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${className || ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);


const CloseIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const SearchBar: React.FC<SearchBarProps> = ({ stockList, onSearch }) => {
    const [input, setInput] = useState('');
    const [suggestions, setSuggestions] = useState<StockListItem[]>([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const [showSuggestions, setShowSuggestions] = useState(false); // New state to control visibility
    const searchContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (input.trim() && stockList.length > 0) {
            const lowerCaseInput = input.toLowerCase();
            const filtered = stockList.filter(stock => {
                const nameMatch = stock.name.toLowerCase().includes(lowerCaseInput);
                const codeMatch = stock.code.includes(lowerCaseInput);
                const aliasMatch = stock.alias?.some(a => a.toLowerCase().includes(lowerCaseInput));
                return nameMatch || codeMatch || aliasMatch;
            }).slice(0, 7); // Limit suggestions to 7
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
        setActiveSuggestionIndex(-1);
    }, [input, stockList]);
    
    const handleSearch = (term: string) => {
        onSearch(term);
        setInput(term);
        setShowSuggestions(false); // Hide suggestions on search commit
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        setShowSuggestions(true); // Show suggestions while typing
    };

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const termToSearch = activeSuggestionIndex > -1 ? suggestions[activeSuggestionIndex].name : input;
        handleSearch(termToSearch.trim());
    };

    const handleSuggestionClick = (stock: StockListItem) => {
        handleSearch(stock.name);
    };
    
    const handleClearInput = () => {
        setInput('');
        onSearch('');
        setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!showSuggestions || suggestions.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActiveSuggestionIndex(prev => (prev > 0 ? prev - 1 : 0));
        }
    };
    
    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const highlightMatch = (text: string) => {
        if (!input.trim()) return text;
        const regex = new RegExp(`(${input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        const parts = text.split(regex);
        return (
            <>
                {parts.map((part, i) =>
                    regex.test(part) ? (
                        <strong key={i} className="text-brand-orange font-bold">{part}</strong>
                    ) : (
                        <span key={i}>{part}</span>
                    )
                )}
            </>
        );
    };

    return (
        <form onSubmit={handleFormSubmit} className="max-w-2xl mx-auto">
            <div className="relative" ref={searchContainerRef}>
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <SearchIcon className="text-text-light-secondary dark:text-text-dark-secondary" />
                </div>
                <input
                    type="text"
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="搜尋股票 (代號/名稱/縮寫)"
                    className="w-full pl-9 pr-28 py-3 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange/80 focus:border-transparent transition-colors shadow-sm text-text-light-primary dark:text-text-dark-primary placeholder:text-text-light-secondary dark:placeholder:text-text-dark-secondary"
                    autoComplete="off"
                />
                <div className="absolute inset-y-0 right-0 flex items-center">
                   {input && (
                       <button
                           type="button"
                           onClick={handleClearInput}
                           className="p-2 text-text-light-secondary dark:text-text-dark-secondary hover:text-text-light-primary dark:hover:text-text-dark-primary transition-colors rounded-full mr-1"
                           aria-label="清除搜尋"
                       >
                           <CloseIcon className="w-5 h-5"/>
                       </button>
                   )}
                    <button
                        type="submit"
                        className="h-[calc(100%-0.75rem)] my-1.5 mr-1.5 px-5 bg-brand-orange hover:bg-brand-orange/90 text-white rounded-lg text-sm font-semibold transition-colors transform hover:scale-105"
                        aria-label="搜尋"
                    >
                        搜尋
                    </button>
                </div>

                {showSuggestions && suggestions.length > 0 && (
                    <ul className="absolute z-10 w-full mt-2 bg-light-card dark:bg-dark-card border border-light-border dark:border-dark-border rounded-xl shadow-lg overflow-hidden animate-fade-in">
                        {suggestions.map((stock, index) => (
                            <li
                                key={stock.code}
                                onClick={() => handleSuggestionClick(stock)}
                                className={`px-4 py-3 cursor-pointer text-left transition-colors ${
                                    index === activeSuggestionIndex 
                                    ? 'bg-brand-orange/10 dark:bg-brand-orange/20' 
                                    : 'hover:bg-slate-100 dark:hover:bg-white/5'
                                }`}
                            >
                                <div className="font-semibold text-text-light-primary dark:text-text-dark-primary">
                                    {highlightMatch(stock.name)}
                                </div>
                                <div className="text-sm text-text-light-secondary dark:text-text-dark-secondary">
                                    {highlightMatch(stock.code)}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </form>
    );
};

export default React.memo(SearchBar);
