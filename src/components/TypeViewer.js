'use client';

import { useState, useEffect } from 'react';
import styles from './TypeViewer.module.css';

export default function TypeViewer() {
    const [schemas, setSchemas] = useState([]);
    const [selectedSchemaIndex, setSelectedSchemaIndex] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchText, setSearchText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    useEffect(() => {
        const fetchTypes = async () => {
            try {
                const res = await fetch('/api/github/types');
                if (!res.ok) throw new Error('Failed to fetch types');
                const data = await res.json();

                // Parse all types
                const extracted = parseAllTypes(data.content);
                console.log('Total types found:', extracted.length);
                setSchemas(extracted);
                if (extracted.length > 0) {
                    setSelectedSchemaIndex(0);
                }

            } catch (err) {
                console.error('Error:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchTypes();
    }, []);

    const parseAllTypes = (content) => {
        const allTypes = [];
        const lines = content.split('\n');

        // 1. Extract all types from components.schemas (HIGHEST PRIORITY)
        const schemasMatch = content.match(/schemas:\s*\{/);
        if (schemasMatch) {
            const startIndex = content.indexOf('schemas:', schemasMatch.index) + 'schemas:'.length;
            let braceCount = 0;
            let inSchemas = false;
            let schemasContent = '';

            for (let i = startIndex; i < content.length; i++) {
                const char = content[i];
                if (char === '{') {
                    if (!inSchemas) inSchemas = true;
                    braceCount++;
                } else if (char === '}') {
                    braceCount--;
                }

                if (inSchemas) {
                    schemasContent += char;
                }

                if (inSchemas && braceCount === 0) {
                    break;
                }
            }

            const types = parseTypesFromBlock(schemasContent, 'schema', 100);
            allTypes.push(...types);
        }

        // 2. Extract export type definitions (BEFORE line 5300, LOWER PRIORITY)
        let currentLineNumber = 0;

        for (let i = 0; i < lines.length; i++) {
            currentLineNumber = i + 1;
            const line = lines[i];

            // Skip lines after 5300
            if (currentLineNumber > 5300) {
                break;
            }

            // Match single-line export type
            const singleLineMatch = line.match(/^export\s+type\s+(\w+)\s*=\s*(.+);?\s*$/);
            if (singleLineMatch) {
                const typeName = singleLineMatch[1];
                const typeDefinition = singleLineMatch[2].trim();

                // Check if it's a simple alias to components['schemas']
                const isSchemaAlias = typeDefinition.match(/^components\[['"]schemas['"]\]\[['"](\w+)['"]\]$/);

                // ALWAYS keep Request/Response/Updatable/CreateOnly types, even if they are aliases
                const isImportantType = typeName.endsWith('Request') ||
                    typeName.endsWith('Response') ||
                    typeName.endsWith('Updatable') ||
                    typeName.endsWith('CreateOnly');

                if (isSchemaAlias && !isImportantType) {
                    // Skip simple non-important aliases
                    continue;
                }

                allTypes.push({
                    name: typeName,
                    content: line,
                    category: 'type',
                    priority: isImportantType ? 50 : 10
                });
            }
        }

        // 3. Extract export interface definitions (MEDIUM PRIORITY, BEFORE line 5300)
        currentLineNumber = 0;
        let currentInterface = null;
        let interfaceContent = '';
        let interfaceBraceCount = 0;
        let inInterface = false;
        let interfaceStartLine = 0;

        for (let i = 0; i < lines.length; i++) {
            currentLineNumber = i + 1;
            const line = lines[i];

            const interfaceMatch = line.match(/^export\s+interface\s+(\w+)/);

            if (interfaceMatch && !inInterface) {
                interfaceStartLine = currentLineNumber;
                currentInterface = interfaceMatch[1];
                inInterface = true;
                interfaceContent = line;
                interfaceBraceCount = (line.match(/\{/g) || []).length;
                interfaceBraceCount -= (line.match(/\}/g) || []).length;
                continue;
            }

            if (inInterface) {
                interfaceContent += '\n' + line;
                interfaceBraceCount += (line.match(/\{/g) || []).length;
                interfaceBraceCount -= (line.match(/\}/g) || []).length;

                if (interfaceBraceCount === 0) {
                    // Only add if it started before line 5300
                    if (interfaceStartLine <= 5300) {
                        allTypes.push({
                            name: currentInterface,
                            content: interfaceContent,
                            category: 'interface',
                            priority: 50
                        });
                    }
                    currentInterface = null;
                    interfaceContent = '';
                    inInterface = false;
                }
            }
        }

        // Remove duplicates - keep highest priority
        const uniqueTypes = [];
        const nameMap = new Map();

        for (const type of allTypes) {
            const existing = nameMap.get(type.name);
            if (!existing || type.priority > existing.priority) {
                nameMap.set(type.name, type);
            }
        }

        nameMap.forEach(type => {
            delete type.priority;
            uniqueTypes.push(type);
        });

        // Sort alphabetically
        uniqueTypes.sort((a, b) => a.name.localeCompare(b.name));

        return uniqueTypes;
    };

    const parseTypesFromBlock = (blockContent, categoryName, priority) => {
        const types = [];
        const lines = blockContent.split('\n');

        // First pass: identify all type definitions and their line numbers
        const typeDefinitions = [];
        let currentType = null;
        let typeStartLine = -1;
        let typeBraceCount = 0;
        let inType = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Skip comment lines in first pass
            if (trimmed.startsWith('/**') || trimmed.startsWith('*') || trimmed === '*/') {
                continue;
            }

            // Match single-line definition: TypeName: ...;
            const singleLineMatch = line.match(/^\s*["']?(\w+)["']?\s*:\s*(.+);$/);
            if (singleLineMatch && !inType) {
                typeDefinitions.push({
                    name: singleLineMatch[1],
                    startLine: i,
                    endLine: i,
                    isSingleLine: true
                });
                continue;
            }

            // Match block-style definition: TypeName: {
            const typeStartMatch = line.match(/^\s*["']?(\w+)["']?\s*:\s*\{/);
            if (typeStartMatch && !inType) {
                currentType = typeStartMatch[1];
                typeStartLine = i;
                inType = true;
                typeBraceCount = 1;
                continue;
            }

            if (inType) {
                typeBraceCount += (line.match(/\{/g) || []).length;
                typeBraceCount -= (line.match(/\}/g) || []).length;

                if (typeBraceCount === 0) {
                    typeDefinitions.push({
                        name: currentType,
                        startLine: typeStartLine,
                        endLine: i,
                        isSingleLine: false
                    });
                    currentType = null;
                    inType = false;
                }
            }
        }

        // Second pass: extract content with correct JSDoc comments
        for (const typeDef of typeDefinitions) {
            let commentStartLine = -1;

            // Look backwards from type start to find JSDoc comment
            for (let i = typeDef.startLine - 1; i >= 0; i--) {
                const trimmed = lines[i].trim();

                if (trimmed === '*/') {
                    // Found end of JSDoc comment, continue looking for start
                    continue;
                } else if (trimmed.startsWith('/**')) {
                    // Found start of JSDoc comment
                    commentStartLine = i;
                    break;
                } else if (trimmed.startsWith('*')) {
                    // Inside JSDoc comment, continue
                    continue;
                } else if (trimmed === '' || trimmed.startsWith('//')) {
                    // Empty line or single-line comment, continue
                    continue;
                } else {
                    // Hit non-comment content, stop looking
                    break;
                }
            }

            // Extract content
            let content = '';
            const contentStartLine = commentStartLine >= 0 ? commentStartLine : typeDef.startLine;

            for (let i = contentStartLine; i <= typeDef.endLine; i++) {
                if (content) content += '\n';
                content += lines[i];
            }

            types.push({
                name: typeDef.name,
                content: content,
                category: categoryName,
                priority: priority
            });
        }

        return types;
    };

    if (loading) return <div className={styles.loading}>Loading types...</div>;
    if (error) return <div className={styles.error}>Error: {error}</div>;

    // Extract unique categories from type names
    const categories = ['all'];
    const categoryKeywords = ['Image', 'InstanceType', 'Network', 'SecurityGroup', 'PhysicalNode', 'VirtualMachine', 'Volume', 'Backup', 'Snapshot', 'User', 'Portfolio', 'Login'];

    schemas.forEach(schema => {
        for (const keyword of categoryKeywords) {
            if (schema.name.includes(keyword) && !categories.includes(keyword)) {
                categories.push(keyword);
            }
        }
    });

    // Filter schemas based on search text and category
    const filteredSchemas = schemas.filter(schema => {
        const matchesSearch = schema.name.toLowerCase().includes(searchText.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || schema.name.includes(selectedCategory);
        return matchesSearch && matchesCategory;
    });

    const selectedSchema = selectedSchemaIndex !== null && selectedSchemaIndex < filteredSchemas.length
        ? filteredSchemas[selectedSchemaIndex]
        : null;

    return (
        <div className={styles.container}>
            {/* Sidebar */}
            <div className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <h3 className={styles.sidebarTitle}>API Type Definitions</h3>
                    <div className={styles.typeCount}>
                        {filteredSchemas.length} / {schemas.length} types
                    </div>
                </div>

                {/* Search Box */}
                <div className={styles.searchBox}>
                    <input
                        type="text"
                        placeholder="Search types..."
                        value={searchText}
                        onChange={(e) => {
                            setSearchText(e.target.value);
                            setSelectedSchemaIndex(null);
                        }}
                        className={styles.searchInput}
                    />
                </div>

                {/* Category Filter */}
                <div className={styles.filterBox}>
                    <select
                        value={selectedCategory}
                        onChange={(e) => {
                            setSelectedCategory(e.target.value);
                            setSelectedSchemaIndex(null);
                        }}
                        className={styles.categorySelect}
                    >
                        {categories.map(cat => (
                            <option key={cat} value={cat}>
                                {cat === 'all' ? 'All Categories' : cat}
                            </option>
                        ))}
                    </select>
                </div>

                <div className={styles.schemaList}>
                    {filteredSchemas.length === 0 ? (
                        <div style={{ padding: '1rem', fontSize: '0.85rem', color: '#666' }}>
                            No types found
                        </div>
                    ) : (
                        filteredSchemas.map((schema, idx) => (
                            <div
                                key={idx}
                                className={`${styles.schemaItem} ${selectedSchemaIndex === idx ? styles.active : ''}`}
                                onClick={() => setSelectedSchemaIndex(idx)}
                            >
                                <span className={styles.schemaIcon}>
                                    {schema.category === 'interface' ? 'I' : 'T'}
                                </span>
                                <span className={styles.schemaName}>{schema.name}</span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Content */}
            <div className={styles.content}>
                {selectedSchema ? (
                    <div className={styles.codeContainer}>
                        <div className={styles.typeHeader}>
                            <h2 className={styles.typeName}>{selectedSchema.name}</h2>
                            <span className={styles.typeCategory}>
                                {selectedSchema.category === 'interface' ? 'Interface' : selectedSchema.category === 'schema' ? 'Schema' : 'Type'}
                            </span>
                        </div>
                        <pre className={styles.codeBlock}>
                            <code>{selectedSchema.content}</code>
                        </pre>
                    </div>
                ) : (
                    <div className={styles.emptyState}>
                        {schemas.length > 0 ? 'Select a type from the sidebar' : 'Waiting for types to load...'}
                    </div>
                )}
            </div>
        </div>
    );
}
