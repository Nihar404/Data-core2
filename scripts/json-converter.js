/**
 * JSON Converter Utility
 * Converts JSON data into SQL and NoSQL friendly formats
 */

class JSONConverter {
    constructor() {
        this.sqlTableCounter = 0;
    }

    /**
     * Analyze JSON structure to determine best conversion strategy
     * @param {Object|Array} jsonData - The JSON data to analyze
     * @returns {Object} Analysis results with structure type and recommendations
     */
    analyzeStructure(jsonData) {
        const analysis = {
            type: Array.isArray(jsonData) ? 'array' : typeof jsonData,
            isFlat: true,
            isNested: false,
            isRelational: false,
            depth: 0,
            hasArrays: false,
            hasObjects: false,
            complexity: 'simple',
            recommendation: 'nosql', // Default recommendation
            itemCount: 0,
            fields: new Set()
        };

        if (Array.isArray(jsonData)) {
            analysis.itemCount = jsonData.length;
            if (jsonData.length > 0) {
                const depth = this._calculateDepth(jsonData[0]);
                analysis.depth = depth;

                // Analyze first few items for structure
                const sampleSize = Math.min(10, jsonData.length);
                for (let i = 0; i < sampleSize; i++) {
                    this._analyzeObject(jsonData[i], analysis);
                }
            }
        } else if (typeof jsonData === 'object' && jsonData !== null) {
            analysis.itemCount = 1;
            analysis.depth = this._calculateDepth(jsonData);
            this._analyzeObject(jsonData, analysis);
        }

        // Determine structure characteristics
        if (analysis.depth > 2) {
            analysis.isNested = true;
            analysis.isFlat = false;
        }

        if (analysis.hasArrays && analysis.hasObjects) {
            analysis.isRelational = true;
            analysis.complexity = 'complex';
        } else if (analysis.isNested) {
            analysis.complexity = 'moderate';
        }

        // Make recommendation
        if (analysis.isRelational || (analysis.depth > 1 && analysis.hasArrays)) {
            analysis.recommendation = 'both'; // Convert to both SQL and NoSQL
        } else if (analysis.isFlat && analysis.itemCount > 100) {
            analysis.recommendation = 'sql'; // Tabular data suits SQL
        } else {
            analysis.recommendation = 'nosql'; // Document-style suits NoSQL
        }

        analysis.fields = Array.from(analysis.fields);

        return analysis;
    }

    /**
     * Calculate depth of nested structure
     */
    _calculateDepth(obj, currentDepth = 0) {
        if (typeof obj !== 'object' || obj === null) {
            return currentDepth;
        }

        let maxDepth = currentDepth;

        const values = Array.isArray(obj) ? obj : Object.values(obj);
        values.forEach(value => {
            if (typeof value === 'object' && value !== null) {
                const depth = this._calculateDepth(value, currentDepth + 1);
                maxDepth = Math.max(maxDepth, depth);
            }
        });

        return maxDepth;
    }

    /**
     * Analyze an object's structure
     */
    _analyzeObject(obj, analysis) {
        if (typeof obj !== 'object' || obj === null) return;

        Object.keys(obj).forEach(key => {
            analysis.fields.add(key);
            const value = obj[key];

            if (Array.isArray(value)) {
                analysis.hasArrays = true;
                if (value.length > 0 && typeof value[0] === 'object') {
                    analysis.isNested = true;
                    analysis.isFlat = false;
                }
            } else if (typeof value === 'object' && value !== null) {
                analysis.hasObjects = true;
                analysis.isNested = true;
                analysis.isFlat = false;
            }
        });
    }

    /**
     * Convert JSON to SQL-friendly structure
     * @param {Object|Array} jsonData - The JSON data to convert
     * @param {String} rootTableName - Name for the root table
     * @returns {Object} SQL structure with tables and relationships
     */
    convertToSQL(jsonData, rootTableName = 'main_table') {
        this.sqlTableCounter = 0;
        const tables = [];
        const relationships = [];

        if (Array.isArray(jsonData)) {
            // Array of records - create a single table
            const table = this._arrayToSQLTable(jsonData, rootTableName);
            tables.push(table);

            // Extract nested objects/arrays into separate tables
            this._extractNestedTables(jsonData, rootTableName, tables, relationships);
        } else if (typeof jsonData === 'object' && jsonData !== null) {
            // Single object - create table with one row
            const table = this._objectToSQLTable(jsonData, rootTableName);
            tables.push(table);

            // Extract nested structures
            this._extractNestedTables([jsonData], rootTableName, tables, relationships);
        } else {
            // Primitive value - wrap in table
            tables.push({
                name: rootTableName,
                columns: ['id', 'value'],
                rows: [[1, jsonData]],
                primaryKey: 'id'
            });
        }

        return {
            database: rootTableName + '_db',
            tables: tables,
            relationships: relationships,
            metadata: {
                tableCount: tables.length,
                totalRows: tables.reduce((sum, t) => sum + t.rows.length, 0),
                conversionDate: new Date().toISOString()
            }
        };
    }

    /**
     * Convert array of objects to SQL table
     */
    _arrayToSQLTable(array, tableName) {
        if (array.length === 0) {
            return {
                name: tableName,
                columns: ['id'],
                rows: [],
                primaryKey: 'id'
            };
        }

        // Collect all unique columns from all objects
        const columnsSet = new Set(['id']);
        array.forEach(item => {
            if (typeof item === 'object' && item !== null) {
                Object.keys(item).forEach(key => {
                    // Only include primitive values and exclude nested objects/arrays
                    if (!this._isComplexType(item[key])) {
                        columnsSet.add(key);
                    }
                });
            }
        });

        const columns = Array.from(columnsSet);

        // Create rows
        const rows = array.map((item, index) => {
            const row = [index + 1]; // ID column

            columns.slice(1).forEach(col => {
                if (typeof item === 'object' && item !== null) {
                    const value = item[col];
                    row.push(this._isComplexType(value) ? null : this._sanitizeSQLValue(value));
                } else {
                    row.push(null);
                }
            });

            return row;
        });

        return {
            name: tableName,
            columns: columns,
            rows: rows,
            primaryKey: 'id',
            columnTypes: this._inferColumnTypes(columns, rows)
        };
    }

    /**
     * Convert single object to SQL table
     */
    _objectToSQLTable(obj, tableName) {
        const columns = ['id'];
        const values = [1];

        Object.keys(obj).forEach(key => {
            if (!this._isComplexType(obj[key])) {
                columns.push(key);
                values.push(this._sanitizeSQLValue(obj[key]));
            }
        });

        return {
            name: tableName,
            columns: columns,
            rows: [values],
            primaryKey: 'id',
            columnTypes: this._inferColumnTypes(columns, [values])
        };
    }

    /**
     * Extract nested objects and arrays into separate tables
     */
    _extractNestedTables(dataArray, parentTableName, tables, relationships) {
        if (!Array.isArray(dataArray) || dataArray.length === 0) return;

        const firstItem = dataArray[0];
        if (typeof firstItem !== 'object' || firstItem === null) return;

        Object.keys(firstItem).forEach(key => {
            const values = dataArray.map(item => item[key]).filter(v => v !== undefined);
            if (values.length === 0) return;

            const firstValue = values[0];

            if (Array.isArray(firstValue)) {
                // Nested array - create separate table
                const nestedTableName = `${parentTableName}_${key}`;
                const flatArray = values.flat();

                if (flatArray.length > 0 && typeof flatArray[0] === 'object') {
                    const nestedTable = this._arrayToSQLTable(flatArray, nestedTableName);

                    // Add foreign key column
                    nestedTable.columns.push(`${parentTableName}_id`);
                    nestedTable.rows.forEach((row, idx) => {
                        row.push(Math.floor(idx / (flatArray.length / dataArray.length)) + 1);
                    });

                    tables.push(nestedTable);
                    relationships.push({
                        from: nestedTableName,
                        to: parentTableName,
                        type: 'many-to-one',
                        foreignKey: `${parentTableName}_id`
                    });

                    // Recursively extract deeper nested structures
                    this._extractNestedTables(flatArray, nestedTableName, tables, relationships);
                }
            } else if (typeof firstValue === 'object' && firstValue !== null) {
                // Nested object - create separate table
                const nestedTableName = `${parentTableName}_${key}`;
                const nestedObjects = values.filter(v => typeof v === 'object' && v !== null);

                const nestedTable = this._arrayToSQLTable(nestedObjects, nestedTableName);

                // Add foreign key
                nestedTable.columns.push(`${parentTableName}_id`);
                nestedTable.rows.forEach((row, idx) => {
                    row.push(idx + 1);
                });

                tables.push(nestedTable);
                relationships.push({
                    from: parentTableName,
                    to: nestedTableName,
                    type: 'one-to-one',
                    foreignKey: `${parentTableName}_id`
                });

                // Recursively extract
                this._extractNestedTables(nestedObjects, nestedTableName, tables, relationships);
            }
        });
    }

    /**
     * Convert JSON to NoSQL-friendly structure
     * @param {Object|Array} jsonData - The JSON data to convert
     * @param {String} collectionName - Name for the collection
     * @returns {Object} NoSQL structure with collections and documents
     */
    convertToNoSQL(jsonData, collectionName = 'main_collection') {
        const collections = [];

        if (Array.isArray(jsonData)) {
            // Array becomes a collection of documents
            const documents = jsonData.map((item, index) =>
                this._createNoSQLDocument(item, index)
            );

            collections.push({
                name: collectionName,
                documents: documents,
                indexes: this._suggestNoSQLIndexes(documents)
            });
        } else if (typeof jsonData === 'object' && jsonData !== null) {
            // Single object becomes a collection with one document
            const document = this._createNoSQLDocument(jsonData, 0);

            collections.push({
                name: collectionName,
                documents: [document],
                indexes: this._suggestNoSQLIndexes([document])
            });
        } else {
            // Primitive value
            collections.push({
                name: collectionName,
                documents: [{
                    _id: this._generateObjectId(),
                    value: jsonData,
                    _metadata: {
                        type: typeof jsonData,
                        createdAt: new Date().toISOString()
                    }
                }],
                indexes: []
            });
        }

        // Extract embedded arrays into separate collections if needed
        this._extractEmbeddedCollections(jsonData, collectionName, collections);

        return {
            database: collectionName + '_db',
            collections: collections,
            metadata: {
                collectionCount: collections.length,
                totalDocuments: collections.reduce((sum, c) => sum + c.documents.length, 0),
                conversionDate: new Date().toISOString()
            }
        };
    }

    /**
     * Create a NoSQL document with metadata
     */
    _createNoSQLDocument(data, index) {
        const doc = {
            _id: this._generateObjectId(index),
            ...this._processNoSQLValue(data),
            _metadata: {
                createdAt: new Date().toISOString(),
                version: 1,
                index: index
            }
        };

        return doc;
    }

    /**
     * Process values for NoSQL format (preserve nested structures)
     */
    _processNoSQLValue(value) {
        if (Array.isArray(value)) {
            return { value: value.map(item => this._processNoSQLValue(item)) };
        } else if (typeof value === 'object' && value !== null) {
            const processed = {};
            Object.keys(value).forEach(key => {
                processed[key] = this._processNoSQLValueField(value[key]);
            });
            return processed;
        } else {
            return { value: value };
        }
    }

    /**
     * Process individual field values
     */
    _processNoSQLValueField(value) {
        if (Array.isArray(value)) {
            return value.map(item =>
                typeof item === 'object' && item !== null
                    ? this._processNoSQLValue(item)
                    : item
            );
        } else if (typeof value === 'object' && value !== null) {
            return this._processNoSQLValue(value);
        } else {
            return value;
        }
    }

    /**
     * Extract embedded arrays into separate collections
     */
    _extractEmbeddedCollections(data, parentCollection, collections) {
        if (Array.isArray(data)) {
            data.forEach(item => {
                if (typeof item === 'object' && item !== null) {
                    this._extractFromObject(item, parentCollection, collections);
                }
            });
        } else if (typeof data === 'object' && data !== null) {
            this._extractFromObject(data, parentCollection, collections);
        }
    }

    /**
     * Extract arrays from object into collections
     */
    _extractFromObject(obj, parentCollection, collections) {
        Object.keys(obj).forEach(key => {
            const value = obj[key];

            if (Array.isArray(value) && value.length > 0) {
                // Check if array contains objects
                const hasObjects = value.some(item => typeof item === 'object' && item !== null);

                if (hasObjects) {
                    const embeddedCollectionName = `${parentCollection}_${key}`;

                    // Check if collection already exists
                    if (!collections.find(c => c.name === embeddedCollectionName)) {
                        const documents = value
                            .filter(item => typeof item === 'object' && item !== null)
                            .map((item, idx) => this._createNoSQLDocument(item, idx));

                        if (documents.length > 0) {
                            collections.push({
                                name: embeddedCollectionName,
                                documents: documents,
                                indexes: this._suggestNoSQLIndexes(documents),
                                parentCollection: parentCollection
                            });
                        }
                    }
                }
            }
        });
    }

    /**
     * Suggest indexes for NoSQL collection
     */
    _suggestNoSQLIndexes(documents) {
        if (documents.length === 0) return [];

        const indexes = [];
        const fieldCounts = {};

        // Count field occurrences
        documents.forEach(doc => {
            Object.keys(doc).forEach(key => {
                if (key !== '_id' && key !== '_metadata') {
                    fieldCounts[key] = (fieldCounts[key] || 0) + 1;
                }
            });
        });

        // Suggest indexes for common fields
        Object.keys(fieldCounts).forEach(field => {
            const coverage = fieldCounts[field] / documents.length;
            if (coverage > 0.8) { // Field appears in >80% of documents
                indexes.push({
                    field: field,
                    type: 'single',
                    unique: false
                });
            }
        });

        // Suggest common composite indexes
        if (fieldCounts['userId'] && fieldCounts['createdAt']) {
            indexes.push({
                fields: ['userId', 'createdAt'],
                type: 'composite'
            });
        }

        return indexes;
    }

    /**
     * Infer SQL column types from data
     */
    _inferColumnTypes(columns, rows) {
        const types = {};

        columns.forEach((col, colIndex) => {
            if (col === 'id') {
                types[col] = 'INTEGER PRIMARY KEY';
                return;
            }

            const values = rows.map(row => row[colIndex]).filter(v => v !== null && v !== undefined);

            if (values.length === 0) {
                types[col] = 'TEXT';
                return;
            }

            const firstValue = values[0];

            if (typeof firstValue === 'number') {
                types[col] = Number.isInteger(firstValue) ? 'INTEGER' : 'REAL';
            } else if (typeof firstValue === 'boolean') {
                types[col] = 'BOOLEAN';
            } else if (this._isDate(firstValue)) {
                types[col] = 'DATETIME';
            } else if (this._isEmail(firstValue)) {
                types[col] = 'VARCHAR(255)';
            } else {
                types[col] = 'TEXT';
            }
        });

        return types;
    }

    /**
     * Helper: Check if value is complex (object or array)
     */
    _isComplexType(value) {
        return (typeof value === 'object' && value !== null) || Array.isArray(value);
    }

    /**
     * Helper: Sanitize value for SQL
     */
    _sanitizeSQLValue(value) {
        if (value === null || value === undefined) return null;
        if (typeof value === 'string') return value.replace(/'/g, "''");
        if (typeof value === 'boolean') return value ? 1 : 0;
        return value;
    }

    /**
     * Helper: Check if string is a date
     */
    _isDate(str) {
        if (typeof str !== 'string') return false;
        const date = new Date(str);
        return !isNaN(date.getTime()) && str.match(/\d{4}-\d{2}-\d{2}/);
    }

    /**
     * Helper: Check if string is an email
     */
    _isEmail(str) {
        if (typeof str !== 'string') return false;
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
    }

    /**
     * Generate MongoDB-style ObjectId
     */
    _generateObjectId(index = 0) {
        const timestamp = Math.floor(Date.now() / 1000).toString(16);
        const random = Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
        const counter = index.toString(16).padStart(6, '0');
        return timestamp + random + counter;
    }

    /**
     * Generate SQL CREATE TABLE statements
     */
    generateSQLSchema(sqlStructure) {
        const statements = [];

        sqlStructure.tables.forEach(table => {
            let createTable = `CREATE TABLE ${table.name} (\n`;

            const columnDefs = table.columns.map(col => {
                const type = table.columnTypes[col] || 'TEXT';
                return `  ${col} ${type}`;
            });

            createTable += columnDefs.join(',\n');
            createTable += '\n);';

            statements.push(createTable);
        });

        // Add relationship comments
        if (sqlStructure.relationships.length > 0) {
            statements.push('\n-- Relationships:');
            sqlStructure.relationships.forEach(rel => {
                statements.push(`-- ${rel.from}.${rel.foreignKey} -> ${rel.to}.id (${rel.type})`);
            });
        }

        return statements.join('\n\n');
    }

    /**
     * Generate SQL INSERT statements
     */
    generateSQLInserts(sqlStructure) {
        const statements = [];

        sqlStructure.tables.forEach(table => {
            if (table.rows.length === 0) return;

            const columns = table.columns.join(', ');

            table.rows.forEach(row => {
                const values = row.map(val => {
                    if (val === null || val === undefined) return 'NULL';
                    if (typeof val === 'string') return `'${val}'`;
                    return val;
                }).join(', ');

                statements.push(`INSERT INTO ${table.name} (${columns}) VALUES (${values});`);
            });
        });

        return statements.join('\n');
    }

    /**
     * Generate preview summary
     */
    generatePreview(jsonData, sqlStructure, nosqlStructure) {
        return {
            original: {
                type: Array.isArray(jsonData) ? 'array' : typeof jsonData,
                size: JSON.stringify(jsonData).length,
                itemCount: Array.isArray(jsonData) ? jsonData.length : 1
            },
            sql: {
                tableCount: sqlStructure.tables.length,
                totalRows: sqlStructure.metadata.totalRows,
                relationships: sqlStructure.relationships.length,
                mainTable: sqlStructure.tables[0]
            },
            nosql: {
                collectionCount: nosqlStructure.collections.length,
                totalDocuments: nosqlStructure.metadata.totalDocuments,
                indexes: nosqlStructure.collections.reduce((sum, c) => sum + c.indexes.length, 0),
                mainCollection: nosqlStructure.collections[0]
            }
        };
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JSONConverter;
}
