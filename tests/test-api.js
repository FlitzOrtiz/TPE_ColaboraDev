const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');
const app = require('../backend/server');

describe('API Tests', () => {
    const testDataFile = path.join(__dirname, '../backend/data/pages-test.json');

    beforeEach(async () => {
        // Limpiar datos de prueba
        try {
            await fs.unlink(testDataFile);
        } catch (error) {
            // Archivo no existe, continuar
        }
    });

    afterAll(async () => {
        // Limpiar después de las pruebas
        try {
            await fs.unlink(testDataFile);
        } catch (error) {
            // Archivo no existe, continuar
        }
    });

    describe('GET /api/health', () => {
        test('should return health status', async () => {
            const response = await request(app)
                .get('/api/health')
                .expect(200);

            expect(response.body).toHaveProperty('status', 'OK');
            expect(response.body).toHaveProperty('timestamp');
            expect(response.body).toHaveProperty('uptime');
        });
    });

    describe('GET /api/pages', () => {
        test('should return empty array initially', async () => {
            const response = await request(app)
                .get('/api/pages')
                .expect(200);

            expect(Array.isArray(response.body)).toBe(true);
        });
    });

    describe('POST /api/pages', () => {
        test('should create a new page', async () => {
            const newPage = {
                title: 'Test Page',
                content: 'Test content'
            };

            const response = await request(app)
                .post('/api/pages')
                .send(newPage)
                .expect(201);

            expect(response.body).toHaveProperty('id');
            expect(response.body.title).toBe(newPage.title);
            expect(response.body.content).toBe(newPage.content);
            expect(response.body).toHaveProperty('createdAt');
            expect(response.body).toHaveProperty('updatedAt');
        });

        test('should create page with default title if empty', async () => {
            const newPage = {
                content: 'Test content'
            };

            const response = await request(app)
                .post('/api/pages')
                .send(newPage)
                .expect(201);

            expect(response.body.title).toBe('Sin título');
            expect(response.body.content).toBe(newPage.content);
        });

        test('should return 400 if no title or content provided', async () => {
            const response = await request(app)
                .post('/api/pages')
                .send({})
                .expect(400);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('GET /api/pages/:id', () => {
        let createdPage;

        beforeEach(async () => {
            const newPage = {
                title: 'Test Page',
                content: 'Test content'
            };

            const response = await request(app)
                .post('/api/pages')
                .send(newPage);

            createdPage = response.body;
        });

        test('should return specific page', async () => {
            const response = await request(app)
                .get(`/api/pages/${createdPage.id}`)
                .expect(200);

            expect(response.body.id).toBe(createdPage.id);
            expect(response.body.title).toBe(createdPage.title);
        });

        test('should return 404 for non-existent page', async () => {
            const response = await request(app)
                .get('/api/pages/non-existent-id')
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('PUT /api/pages/:id', () => {
        let createdPage;

        beforeEach(async () => {
            const newPage = {
                title: 'Test Page',
                content: 'Test content'
            };

            const response = await request(app)
                .post('/api/pages')
                .send(newPage);

            createdPage = response.body;
        });

        test('should update page', async () => {
            const updatedData = {
                title: 'Updated Title',
                content: 'Updated content'
            };

            const response = await request(app)
                .put(`/api/pages/${createdPage.id}`)
                .send(updatedData)
                .expect(200);

            expect(response.body.title).toBe(updatedData.title);
            expect(response.body.content).toBe(updatedData.content);
            expect(response.body.updatedAt).not.toBe(createdPage.updatedAt);
        });

        test('should return 404 for non-existent page', async () => {
            const response = await request(app)
                .put('/api/pages/non-existent-id')
                .send({ title: 'Updated' })
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });

    describe('DELETE /api/pages/:id', () => {
        let createdPage;

        beforeEach(async () => {
            const newPage = {
                title: 'Test Page',
                content: 'Test content'
            };

            const response = await request(app)
                .post('/api/pages')
                .send(newPage);

            createdPage = response.body;
        });

        test('should delete page', async () => {
            const response = await request(app)
                .delete(`/api/pages/${createdPage.id}`)
                .expect(200);

            expect(response.body).toHaveProperty('message');
            expect(response.body.page.id).toBe(createdPage.id);

            // Verificar que la página fue eliminada
            await request(app)
                .get(`/api/pages/${createdPage.id}`)
                .expect(404);
        });

        test('should return 404 for non-existent page', async () => {
            const response = await request(app)
                .delete('/api/pages/non-existent-id')
                .expect(404);

            expect(response.body).toHaveProperty('error');
        });
    });
});
