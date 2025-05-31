export default class ImageTool {
  constructor(context) {
    this.context = context;
  }

  uploadImage(file) {
    const { addElement } = this.context;
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const img = new Image();
        img.src = e.target.result;
        
        img.onload = () => {
          // Calculate dimensions while maintaining aspect ratio
          const maxWidth = 500;
          const maxHeight = 500;
          let width = img.width;
          let height = img.height;
          
          if (width > maxWidth) {
            height = (maxWidth / width) * height;
            width = maxWidth;
          }
          
          if (height > maxHeight) {
            width = (maxHeight / height) * width;
            height = maxHeight;
          }
          
          const newElement = {
            type: 'image',
            x: 100,
            y: 100,
            width: width,
            height: height,
            src: e.target.result
          };
          
          addElement(newElement);
          resolve(newElement);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }
}