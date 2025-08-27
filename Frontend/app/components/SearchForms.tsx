import React, { useState } from 'react';
import axios from 'axios';

const SearchComponent = () => {
    const [searchType, setSearchType] = useState('cbml');
    const [searchValue, setSearchValue] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        try {
            let endpoint = '';
            let payload = {};

            switch (searchType) {
                case 'cbml':
                    endpoint = '/api/lotes/public/cbml/';
                    payload = { cbml: searchValue };
                    break;
                case 'matricula':
                    endpoint = '/api/lotes/public/matricula/';
                    payload = { matricula: searchValue };
                    break;
                case 'direccion':
                    endpoint = '/api/lotes/public/direccion/';
                    payload = { direccion: searchValue };
                    break;
            }

            const response = await axios.post(endpoint, payload);
            setResults(response.data);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <form onSubmit={handleSubmit}>
                <select value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                    <option value="cbml">CBML</option>
                    <option value="matricula">Matricula</option>
                    <option value="direccion">Direccion</option>
                </select>
                <input
                    type="text"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    placeholder="Search..."
                />
                <button type="submit" disabled={loading}>
                    {loading ? 'Loading...' : 'Search'}
                </button>
            </form>
            {results && (
                <div>
                    <h2>Results:</h2>
                    <pre>{JSON.stringify(results, null, 2)}</pre>
                </div>
            )}
        </div>
    );
};

export default SearchComponent;