/// <reference types="vite/client" />


declare module '*.woff2' {
    const src: string;
    export default src;
  }
  
  
  declare module '*.png';
  declare module '*.jpg';
  
  
  interface ClipboardItem {
    readonly types: string[];
    getType(type: string): Promise<Blob>;
  }
  
  declare var ClipboardItem: {
    prototype: ClipboardItem;
    new (items: Record<string, Blob | Promise<Blob>>): ClipboardItem;
  };