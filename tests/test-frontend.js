describe('Frontend Tests', () => {
    let notionApp;

    beforeEach(() => {
        // Simular DOM
        document.body.innerHTML = `
            <button id="newPageBtn"></button>
            <div id="pagesTree"></div>
            <div id="editorContainer"></div>
            <div id="welcomeScreen"></div>
            <input id="pageTitle" />
            <div id="editor" contenteditable="true"></div>
            <div id="breadcrumb"></div>
            <button id="saveBtn"></button>
            <button id="deleteBtn"></button>
            <button id="createFirstPage"></button>
            <div id="loadingIndicator"></div>
        `;

        // Mock fetch
        global.fetch = jest.fn();

        // Importar la clase después del setup del DOM
        const { NotionClone } = require('../frontend/app');
        notionApp = new NotionClone();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    test('should initialize elements correctly', () => {
        expect(notionApp.newPageBtn).toBeDefined();
        expect(notionApp.pagesTree).toBeDefined();
        expect(notionApp.editor).toBeDefined();
    });

    test('should show welcome screen initially', () => {
        expect(notionApp.welcomeScreen.style.display).toBe('flex');
        expect(notionApp.editorContainer.style.display).toBe('none');
    });

    test('should mark page as unsaved on content change', () => {
        notionApp.currentPage = 'test-id';
        notionApp.markAsUnsaved();

        expect(notionApp.unsavedChanges).toBe(true);
    });

    test('should create page element correctly', () => {
        const page = {
            id: 'test-id',
            title: 'Test Page',
            content: 'Test content'
        };

        const element = notionApp.createPageElement(page);

        expect(element.classList.contains('page-item')).toBe(true);
        expect(element.dataset.pageId).toBe('test-id');
        expect(element.textContent).toContain('Test Page');
    });

    test('should update breadcrumb correctly', () => {
        notionApp.updateBreadcrumb('Test Page');

        expect(notionApp.breadcrumb.textContent).toContain('Test Page');
        expect(notionApp.breadcrumb.textContent).toContain('Inicio');
    });
});
