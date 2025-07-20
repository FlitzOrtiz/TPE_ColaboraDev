const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data', 'pages.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Asegurar que existe el directorio de datos
async function ensureDataDirectory() {
    const dataDir = path.dirname(DATA_FILE);
    try {
        await fs.access(dataDir);
    } catch {
        await fs.mkdir(dataDir, { recursive: true });
    }
}

// Cargar datos desde archivo
async function loadPages() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        // Si el archivo no existe, devolver array vacío
        return [];
    }
}

// Guardar datos al archivo
async function savePages(pages) {
    await ensureDataDirectory();
    await fs.writeFile(DATA_FILE, JSON.stringify(pages, null, 2));
}

// Middleware para logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Rutas de la API

// GET /api/pages - Obtener todas las páginas
app.get('/api/pages', async (req, res) => {
    try {
        const pages = await loadPages();
        res.json(pages);
    } catch (error) {
        console.error('Error loading pages:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET /api/pages/:id - Obtener una página específica
app.get('/api/pages/:id', async (req, res) => {
    try {
        const pages = await loadPages();
        const page = pages.find(p => p.id === req.params.id);

        if (!page) {
            return res.status(404).json({ error: 'Página no encontrada' });
        }

        res.json(page);
    } catch (error) {
        console.error('Error loading page:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// POST /api/pages - Crear nueva página
app.post('/api/pages', async (req, res) => {
    try {
        const { title, content } = req.body;

        if (!title && !content) {
            return res.status(400).json({ error: 'Título o contenido requerido' });
        }

        const pages = await loadPages();
        const newPage = {
            id: uuidv4(),
            title: title || 'Sin título',
            content: content || '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        pages.push(newPage);
        await savePages(pages);

        res.status(201).json(newPage);
    } catch (error) {
        console.error('Error creating page:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// PUT /api/pages/:id - Actualizar página
app.put('/api/pages/:id', async (req, res) => {
    try {
        const { title, content } = req.body;
        const pages = await loadPages();
        const pageIndex = pages.findIndex(p => p.id === req.params.id);

        if (pageIndex === -1) {
            return res.status(404).json({ error: 'Página no encontrada' });
        }

        pages[pageIndex] = {
            ...pages[pageIndex],
            title: title || pages[pageIndex].title,
            content: content !== undefined ? content : pages[pageIndex].content,
            updatedAt: new Date().toISOString()
        };

        await savePages(pages);
        res.json(pages[pageIndex]);
    } catch (error) {
        console.error('Error updating page:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// DELETE /api/pages/:id - Eliminar página
app.delete('/api/pages/:id', async (req, res) => {
    try {
        const pages = await loadPages();
        const pageIndex = pages.findIndex(p => p.id === req.params.id);

        if (pageIndex === -1) {
            return res.status(404).json({ error: 'Página no encontrada' });
        }

        const deletedPage = pages.splice(pageIndex, 1)[0];
        await savePages(pages);

        res.json({ message: 'Página eliminada', page: deletedPage });
    } catch (error) {
        console.error('Error deleting page:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// GET /api/health - Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Ruta para servir el frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Ruta 404
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Inicializar servidor
async function startServer() {
    try {
        await ensureDataDirectory();

        app.listen(PORT, () => {
            console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
            console.log(`📝 API disponible en http://localhost:${PORT}/api`);
            console.log(`💾 Datos guardados en: ${DATA_FILE}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

startServer();

// Manejo de señales para cierre graceful
process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando servidor...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Cerrando servidor...');
    process.exit(0);
});

module.exports = app;
