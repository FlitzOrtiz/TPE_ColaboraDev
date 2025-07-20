// frontend/app.js
class NotionClone {
    constructor() {
        this.currentPage = null;
        this.pages = new Map();
        this.apiUrl = 'http://localhost:3000/api';
        this.unsavedChanges = false;

        this.initializeElements();
        this.bindEvents();
        this.loadPages();
        this.showWelcomeScreen();
    }

    initializeElements() {
        // Sidebar elements
        this.newPageBtn = document.getElementById('newPageBtn');
        this.pagesTree = document.getElementById('pagesTree');

        // Editor elements
        this.editorContainer = document.getElementById('editorContainer');
        this.welcomeScreen = document.getElementById('welcomeScreen');
        this.pageTitle = document.getElementById('pageTitle');
        this.editor = document.getElementById('editor');
        this.breadcrumb = document.getElementById('breadcrumb');

        // Action buttons
        this.saveBtn = document.getElementById('saveBtn');
        this.deleteBtn = document.getElementById('deleteBtn');
        this.createFirstPage = document.getElementById('createFirstPage');

        // Loading indicator
        this.loadingIndicator = document.getElementById('loadingIndicator');
    }

    bindEvents() {
        // Crear nueva página
        this.newPageBtn.addEventListener('click', () => this.createNewPage());
        this.createFirstPage.addEventListener('click', () => this.createNewPage());

        // Guardar y eliminar
        this.saveBtn.addEventListener('click', () => this.savePage());
        this.deleteBtn.addEventListener('click', () => this.deletePage());

        // Detectar cambios en el editor
        this.pageTitle.addEventListener('input', () => this.markAsUnsaved());
        this.editor.addEventListener('input', () => this.markAsUnsaved());

        // Atajos de teclado
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 's') {
                    e.preventDefault();
                    this.savePage();
                }
                if (e.key === 'n') {
                    e.preventDefault();
                    this.createNewPage();
                }
            }
        });

        // Advertir antes de salir con cambios sin guardar
        window.addEventListener('beforeunload', (e) => {
            if (this.unsavedChanges) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }

    async loadPages() {
        try {
            this.showLoading();
            const response = await fetch(`${this.apiUrl}/pages`);

            if (!response.ok) {
                throw new Error('Error al cargar páginas');
            }

            const pages = await response.json();
            this.renderPagesTree(pages);

        } catch (error) {
            console.error('Error cargando páginas:', error);
            this.showError('Error al cargar páginas');
        } finally {
            this.hideLoading();
        }
    }

    renderPagesTree(pages) {
        this.pagesTree.innerHTML = '';
        this.pages.clear();

        pages.forEach(page => {
            this.pages.set(page.id, page);
            const pageElement = this.createPageElement(page);
            this.pagesTree.appendChild(pageElement);
        });
    }

    createPageElement(page) {
        const pageItem = document.createElement('div');
        pageItem.className = 'page-item';
        pageItem.dataset.pageId = page.id;

        pageItem.innerHTML = `
            <span class="page-icon">📄</span>
            <span class="page-name">${page.title || 'Sin título'}</span>
        `;

        pageItem.addEventListener('click', () => this.selectPage(page.id));
        return pageItem;
    }

    async createNewPage() {
        try {
            this.showLoading();

            const newPage = {
                title: 'Nueva página',
                content: '',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            const response = await fetch(`${this.apiUrl}/pages`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(newPage)
            });

            if (!response.ok) {
                throw new Error('Error al crear página');
            }

            const createdPage = await response.json();
            this.pages.set(createdPage.id, createdPage);

            // Agregar al sidebar
            const pageElement = this.createPageElement(createdPage);
            this.pagesTree.appendChild(pageElement);

            // Seleccionar la nueva página
            this.selectPage(createdPage.id);

        } catch (error) {
            console.error('Error creando página:', error);
            this.showError('Error al crear página');
        } finally {
            this.hideLoading();
        }
    }

    selectPage(pageId) {
        const page = this.pages.get(pageId);
        if (!page) return;

        // Actualizar UI
        this.updatePageSelection(pageId);
        this.hideWelcomeScreen();
        this.showEditor();

        // Cargar contenido
        this.currentPage = pageId;
        this.pageTitle.value = page.title || '';
        this.editor.innerHTML = page.content || '';
        this.updateBreadcrumb(page.title);

        this.unsavedChanges = false;
        this.updateSaveButton();
    }

    updatePageSelection(pageId) {
        // Remover selección anterior
        document.querySelectorAll('.page-item.active').forEach(item => {
            item.classList.remove('active');
        });

        // Agregar selección actual
        const selectedItem = document.querySelector(`[data-page-id="${pageId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('active');
        }
    }

    async savePage() {
        if (!this.currentPage) return;

        try {
            this.showLoading();

            const pageData = {
                title: this.pageTitle.value || 'Sin título',
                content: this.editor.innerHTML,
                updatedAt: new Date().toISOString()
            };

            const response = await fetch(`${this.apiUrl}/pages/${this.currentPage}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(pageData)
            });

            if (!response.ok) {
                throw new Error('Error al guardar página');
            }

            const updatedPage = await response.json();
            this.pages.set(this.currentPage, updatedPage);

            // Actualizar sidebar
            this.updatePageInSidebar(updatedPage);
            this.updateBreadcrumb(updatedPage.title);

            this.unsavedChanges = false;
            this.updateSaveButton();
            this.showSuccess('Página guardada');

        } catch (error) {
            console.error('Error guardando página:', error);
            this.showError('Error al guardar página');
        } finally {
            this.hideLoading();
        }
    }

    async deletePage() {
        if (!this.currentPage) return;

        const confirmed = confirm('¿Estás seguro de que quieres eliminar esta página?');
        if (!confirmed) return;

        try {
            this.showLoading();

            const response = await fetch(`${this.apiUrl}/pages/${this.currentPage}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Error al eliminar página');
            }

            // Remover de la UI
            this.pages.delete(this.currentPage);
            const pageElement = document.querySelector(`[data-page-id="${this.currentPage}"]`);
            if (pageElement) {
                pageElement.remove();
            }

            // Limpiar editor
            this.currentPage = null;
            this.showWelcomeScreen();
            this.hideEditor();

            this.showSuccess('Página eliminada');

        } catch (error) {
            console.error('Error eliminando página:', error);
            this.showError('Error al eliminar página');
        } finally {
            this.hideLoading();
        }
    }

    updatePageInSidebar(page) {
        const pageElement = document.querySelector(`[data-page-id="${page.id}"]`);
        if (pageElement) {
            const nameSpan = pageElement.querySelector('.page-name');
            nameSpan.textContent = page.title || 'Sin título';
            pageElement.classList.remove('unsaved');
        }
    }

    markAsUnsaved() {
        this.unsavedChanges = true;
        this.updateSaveButton();

        // Marcar en sidebar
        const pageElement = document.querySelector(`[data-page-id="${this.currentPage}"]`);
        if (pageElement) {
            pageElement.classList.add('unsaved');
        }
    }

    updateSaveButton() {
        this.saveBtn.disabled = !this.unsavedChanges;
        this.saveBtn.style.opacity = this.unsavedChanges ? '1' : '0.6';
    }

    updateBreadcrumb(title) {
        this.breadcrumb.innerHTML = `
            <span class="breadcrumb-item">Inicio</span>
            <span class="breadcrumb-item">${title || 'Sin título'}</span>
        `;
    }

    showWelcomeScreen() {
        this.welcomeScreen.style.display = 'flex';
        this.editorContainer.style.display = 'none';
    }

    hideWelcomeScreen() {
        this.welcomeScreen.style.display = 'none';
    }

    showEditor() {
        this.editorContainer.style.display = 'block';
    }

    hideEditor() {
        this.editorContainer.style.display = 'none';
    }

    showLoading() {
        this.loadingIndicator.classList.add('active');
    }

    hideLoading() {
        this.loadingIndicator.classList.remove('active');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            background: ${type === 'success' ? 'var(--success-color)' :
                        type === 'error' ? 'var(--danger-color)' :
                        'var(--primary-color)'};
        `;

        document.body.appendChild(notification);

        // Animar entrada
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remover después de 3 segundos
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Utilitarios para el editor
class EditorUtils {
    static formatText(command, value = null) {
        document.execCommand(command, false, value);
    }

    static insertHeading(level) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const heading = document.createElement(`h${level}`);
            heading.textContent = selection.toString() || 'Encabezado';
            range.deleteContents();
            range.insertNode(heading);
            selection.removeAllRanges();
        }
    }

    static insertList(ordered = false) {
        const listType = ordered ? 'insertOrderedList' : 'insertUnorderedList';
        document.execCommand(listType, false, null);
    }

    static insertLink() {
        const url = prompt('Ingresa la URL:');
        if (url) {
            document.execCommand('createLink', false, url);
        }
    }
}

// Inicializar aplicación cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.notionApp = new NotionClone();
});
