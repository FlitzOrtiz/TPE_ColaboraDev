 
class Note {
    constructor(data = {}) {
        this.id = data.id || null;
        this.title = data.title || 'Sin título';
        this.content = data.content || '';
        this.parentId = data.parentId || null;
        this.children = data.children || [];
        this.createdAt = data.createdAt || new Date().toISOString();
        this.updatedAt = data.updatedAt || new Date().toISOString();
        this.tags = data.tags || [];
        this.archived = data.archived || false;
    }

    // Validar estructura de la nota
    validate() {
        const errors = [];

        if (typeof this.title !== 'string') {
            errors.push('Título debe ser una cadena de texto');
        }

        if (typeof this.content !== 'string') {
            errors.push('Contenido debe ser una cadena de texto');
        }

        if (this.parentId && typeof this.parentId !== 'string') {
            errors.push('parentId debe ser una cadena de texto');
        }

        if (!Array.isArray(this.children)) {
            errors.push('children debe ser un array');
        }

        if (!Array.isArray(this.tags)) {
            errors.push('tags debe ser un array');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Convertir a formato JSON
    toJSON() {
        return {
            id: this.id,
            title: this.title,
            content: this.content,
            parentId: this.parentId,
            children: this.children,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
            tags: this.tags,
            archived: this.archived
        };
    }

    // Métodos de utilidad
    addChild(childId) {
        if (!this.children.includes(childId)) {
            this.children.push(childId);
            this.touch();
        }
    }

    removeChild(childId) {
        this.children = this.children.filter(id => id !== childId);
        this.touch();
    }

    addTag(tag) {
        if (!this.tags.includes(tag)) {
            this.tags.push(tag);
            this.touch();
        }
    }

    removeTag(tag) {
        this.tags = this.tags.filter(t => t !== tag);
        this.touch();
    }

    touch() {
        this.updatedAt = new Date().toISOString();
    }

    archive() {
        this.archived = true;
        this.touch();
    }

    unarchive() {
        this.archived = false;
        this.touch();
    }

    // Métodos estáticos
    static fromJSON(data) {
        return new Note(data);
    }

    static createEmpty() {
        return new Note({
            title: 'Nueva página',
            content: ''
        });
    }
}

module.exports = Note;
