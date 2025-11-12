declare module '../../../pdfmake/build/pdfmake' {
    const pdfMake: {
      createPdf: (docDefinition: any) => {
        download: (fileName?: string) => void;
        getBase64: (callback: (base64: string) => void) => void;
        // Ajoutez d'autres méthodes nécessaires ici
      };
      vfs: any;
      fonts: any;
    };
    export default pdfMake;
  }
  
  declare module '../../../pdfmake/build/vfs_fonts' {
    const pdfFonts: { vfs: { [key: string]: string } };
    export default pdfFonts;
  }
  