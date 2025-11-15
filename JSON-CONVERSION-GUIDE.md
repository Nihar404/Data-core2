# JSON Conversion Feature Guide

## Overview

Your Data Bhandaar application now includes advanced JSON processing capabilities that automatically detect, separate, and convert JSON files into SQL-friendly and NoSQL-friendly formats.

## Features

### 1. **Automatic JSON Detection**
- Detects JSON files by MIME type (`application/json`) or file extension (`.json`)
- Analyzes JSON structure to determine if it's more suited for SQL or NoSQL databases
- Provides confidence scores and pattern matching

### 2. **SQL Conversion**
- Converts JSON data into normalized SQL table structures
- Automatically extracts nested objects and arrays into separate tables
- Generates foreign key relationships
- Creates SQL schema (CREATE TABLE statements)
- Generates SQL INSERT statements
- Infers column data types (INTEGER, TEXT, REAL, BOOLEAN, DATETIME, VARCHAR)

### 3. **NoSQL Conversion**
- Converts JSON into document-oriented NoSQL structures
- Preserves nested objects and arrays
- Adds MongoDB-style ObjectIDs to documents
- Suggests indexes based on field coverage
- Organizes data into collections with metadata
- Maintains flexible schema for varying document structures

### 4. **Directory Organization**
All JSON files are automatically organized into separate directories:
- `/json/` - Original JSON files
- `/json-sql/` - SQL-converted structures
- `/json-nosql/` - NoSQL-converted structures
- `/media/images/` - Image files
- `/media/videos/` - Video files
- `/media/audio/` - Audio files

## How to Use

### Step 1: Enable Conversion Options

On the main application page, you'll see a new section titled **JSON_CONVERSION_OPTIONS** with three toggles:

1. **CONVERT_TO_SQL** - Enable to convert JSON to SQL format
2. **CONVERT_TO_NOSQL** - Enable to convert JSON to NoSQL format
3. **STORE_ORIGINAL** - Enable to keep the original JSON file (recommended)

### Step 2: Upload JSON Files

1. Click "SELECT_FILES" or drag and drop JSON files
2. The system will analyze the JSON structure
3. If conversion is enabled, it will:
   - Parse the JSON data
   - Convert to SQL format (if enabled)
   - Convert to NoSQL format (if enabled)
   - Store files in appropriate directories

### Step 3: View Conversion Preview

After uploading, a **CONVERSION_PREVIEW** section will appear showing:

**Original JSON Info:**
- Type (array/object)
- Size
- Item count

**SQL Structure:**
- Number of tables generated
- Total rows across all tables
- Relationships between tables
- Preview of main table with columns and sample rows

**NoSQL Structure:**
- Number of collections
- Total documents
- Suggested indexes
- Preview of documents with their structure

## JSON Conversion Examples

### Example 1: Simple User List (SQL-friendly)

**Input:** `users-sql.json`
```json
[
  {
    "id": 1,
    "user_id": 1001,
    "username": "john_doe",
    "email": "john.doe@example.com",
    "created_at": "2024-01-15T10:30:00Z",
    "status": "active"
  }
]
```

**SQL Output:**
- **Table:** `users_sql`
- **Columns:** id, user_id, username, email, created_at, status
- **Storage:** `/json-sql/users-sql-sql.json`

### Example 2: Products with Nested Data (NoSQL-friendly)

**Input:** `products-nosql.json`
```json
[
  {
    "productId": "PROD-001",
    "name": "Wireless Headphones",
    "tags": ["electronics", "audio", "wireless"],
    "metadata": {
      "brand": "AudioTech",
      "model": "AT-2000X"
    },
    "reviews": [
      {
        "userId": "user123",
        "rating": 5,
        "comment": "Excellent!"
      }
    ]
  }
]
```

**NoSQL Output:**
- **Main Collection:** `products_nosql`
- **Embedded Collections:** `products_nosql_reviews`, `products_nosql_tags`
- **Documents:** Preserves nested structure with `_id` and `_metadata`
- **Storage:** `/json-nosql/products-nosql-nosql.json`

### Example 3: Complex Nested Orders (Both SQL & NoSQL)

**Input:** `nested-orders.json`
```json
{
  "orders": [
    {
      "orderId": "ORD-2024-001",
      "customer": {
        "firstName": "John",
        "address": {
          "street": "123 Main St",
          "city": "New York"
        }
      },
      "items": [
        {
          "productId": "PROD-001",
          "quantity": 2
        }
      ]
    }
  ]
}
```

**SQL Output:**
- **Tables:** `nested_orders` (main), `nested_orders_customer`, `nested_orders_customer_address`, `nested_orders_items`
- **Relationships:** Foreign keys connecting all tables
- **Normalized:** Each nested object becomes a separate table

**NoSQL Output:**
- **Collections:** `nested_orders_db`, `nested_orders_orders_items`, `nested_orders_orders_customer`
- **Structure:** Maintains document hierarchy with embedded objects
- **Indexes:** Suggested on frequently occurring fields

## SQL Conversion Details

### Table Generation Rules

1. **Arrays of objects** → Separate table with foreign key to parent
2. **Nested objects** → Separate table with one-to-one relationship
3. **Primitive arrays** → Stored as text or separate junction table
4. **Complex nested structures** → Recursively extracted into multiple related tables

### Column Type Inference

The system automatically infers SQL column types:
- **INTEGER** - Whole numbers (id, count, quantity)
- **REAL** - Decimal numbers (price, rating)
- **TEXT** - String values
- **VARCHAR(255)** - Email addresses
- **DATETIME** - ISO date strings
- **BOOLEAN** - true/false values (stored as 0/1)

### Example SQL Schema Output

```sql
CREATE TABLE users_sql (
  id INTEGER PRIMARY KEY,
  user_id INTEGER,
  username TEXT,
  email VARCHAR(255),
  created_at DATETIME,
  status TEXT
);

-- Relationships:
-- nested_orders_items.nested_orders_id -> nested_orders.id (many-to-one)
```

## NoSQL Conversion Details

### Document Structure

Each document includes:
- `_id` - MongoDB-style ObjectID (24-character hex string)
- Original fields preserved with full nesting
- `_metadata` - Contains:
  - `createdAt` - Conversion timestamp
  - `version` - Document version (default: 1)
  - `index` - Position in original array

### Index Suggestions

The system suggests indexes on fields that:
- Appear in >80% of documents
- Are commonly used for queries (userId, email, etc.)
- Are part of common access patterns

### Example NoSQL Output

```json
{
  "database": "products_nosql_db",
  "collections": [
    {
      "name": "products_nosql",
      "documents": [
        {
          "_id": "660a1b2c3d4e5f6a7b8c9d0e",
          "productId": "PROD-001",
          "name": "Wireless Headphones",
          "tags": ["electronics", "audio"],
          "_metadata": {
            "createdAt": "2024-03-22T12:00:00.000Z",
            "version": 1,
            "index": 0
          }
        }
      ],
      "indexes": [
        {
          "field": "productId",
          "type": "single",
          "unique": false
        }
      ]
    }
  ]
}
```

## Test Files

Three sample JSON files are included in the `test-data/` directory:

### 1. `users-sql.json`
- **Type:** SQL-friendly
- **Structure:** Array of user objects with flat structure
- **Best for:** Relational database storage
- **Features:** IDs, timestamps, email validation patterns

### 2. `products-nosql.json`
- **Type:** NoSQL-friendly
- **Structure:** Array of products with nested metadata, tags, reviews
- **Best for:** Document database storage
- **Features:** Flexible attributes, embedded arrays, social data

### 3. `nested-orders.json`
- **Type:** Complex nested structure
- **Structure:** Orders with nested customer, items, payment, shipping
- **Best for:** Both SQL and NoSQL (demonstrates full conversion)
- **Features:** Deep nesting (3-4 levels), multiple arrays, mixed types

## File Storage Structure

After conversion, files are stored with metadata indicating their directory:

```javascript
{
  id: "idb_1234567890_abc123",
  filename: "users-sql-sql.json",
  category: "JSON_SQL_CONVERTED",
  metadata: {
    jsonFormat: "sql",  // or "nosql" or "original"
    originalFile: "users-sql.json",
    tableCount: 1,
    totalRows: 4,
    directory: "/json-sql/"  // Virtual directory path
  }
}
```

## API Usage

### Process JSON with Conversions

```javascript
// Enable both SQL and NoSQL conversion
const results = await dataProcessor.processJsonFile(file, {
  convertToSQL: true,
  convertToNoSQL: true,
  storeSeparately: true  // Keep original
});

// Results object:
{
  original: { id: "...", filename: "..." },  // Original file reference
  sql: { id: "...", filename: "...-sql.json" },  // SQL version
  nosql: { id: "...", filename: "...-nosql.json" },  // NoSQL version
  preview: {
    original: { type: "array", size: 1234, itemCount: 10 },
    sql: { tableCount: 3, totalRows: 25, relationships: 2 },
    nosql: { collectionCount: 2, totalDocuments: 10, indexes: 4 }
  }
}
```

### Generate SQL Statements

```javascript
const jsonConverter = new JSONConverter();
const sqlStructure = jsonConverter.convertToSQL(jsonData, 'users');

// Generate CREATE TABLE statements
const schema = jsonConverter.generateSQLSchema(sqlStructure);

// Generate INSERT statements
const inserts = jsonConverter.generateSQLInserts(sqlStructure);
```

## Performance Considerations

- **Large Files:** Files >1MB may take a few seconds to convert
- **Deep Nesting:** Deeply nested JSON (>5 levels) creates more tables/collections
- **Arrays:** Large arrays are efficiently handled with batching
- **Memory:** Conversion happens in-memory; very large files (>50MB) may require chunking

## Troubleshooting

### Issue: Preview not showing
- **Solution:** Ensure both SQL and NoSQL conversion are enabled to see preview

### Issue: Conversion fails
- **Possible causes:**
  - Invalid JSON syntax
  - File too large (>50MB)
  - Circular references in JSON
- **Solution:** Validate JSON using online validator, reduce file size

### Issue: Wrong directory assigned
- **Solution:** Check the `category` and `metadata.jsonFormat` fields in stored file

### Issue: Missing nested tables/collections
- **Solution:** Nested structures with only primitive values may not generate separate tables

## Advanced Features

### Custom Table/Collection Names

```javascript
// Specify custom name for root table
const sqlStructure = jsonConverter.convertToSQL(jsonData, 'my_custom_table');

// Specify custom collection name
const nosqlStructure = jsonConverter.convertToNoSQL(jsonData, 'my_collection');
```

### Preview Without Storing

```javascript
// Just convert and preview without storing
const jsonData = await dataProcessor.readJsonFile(file);
const sqlStructure = jsonConverter.convertToSQL(jsonData, 'preview');
const nosqlStructure = jsonConverter.convertToNoSQL(jsonData, 'preview');
const preview = jsonConverter.generatePreview(jsonData, sqlStructure, nosqlStructure);
```

## Browser Compatibility

- **Chrome/Edge:** Full support (recommended)
- **Firefox:** Full support
- **Safari:** Full support (may require user permission for large files)
- **Mobile browsers:** Supported but with smaller file size limits

## Future Enhancements

Potential future features:
- Direct database export (MySQL, PostgreSQL, MongoDB)
- Custom schema mapping
- Batch conversion of multiple files
- Conversion history and versioning
- Import from converted format back to original
- GraphQL schema generation

## Support

For issues or questions:
1. Check the browser console for error messages
2. Verify JSON file is valid
3. Try with smaller test files first
4. Review this guide for usage patterns

---

**Version:** 1.0.0
**Last Updated:** 2024-03-22
**License:** MIT
