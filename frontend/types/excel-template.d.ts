declare module 'excel-template' {
    export interface TemplateData {
        [key: string]: any;
    }

    export interface Template {
        render(data: TemplateData): Promise<Buffer>;
        renderSync(data: TemplateData): Buffer;
    }

    export function createTemplate(template: Buffer | string): Template;
    export function createTemplate(template: Buffer | string, options?: any): Template;
    
    export default {
        createTemplate
    };
}