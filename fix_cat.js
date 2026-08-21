const fs = require('fs');

const fixCatalogo = () => {
  const filePath = 'src/components/Catalogo.tsx';
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('import Image from "next/image"')) {
    content = content.replace('use client';, 'use client';\nimport Image from "next/image";);
  }

  content = content.replace(
    /<img\s+src=\{imagenCompleta\(item\.imagenUrl\)\}\s+alt=\{item\.nombre\}\s+className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"\s*\/>/g,
    <Image src={imagenCompleta(item.imagenUrl)} alt={item.nombre} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
  );

  content = content.replace(
    /<img\s+src=\{imagenCompleta\(selectedEquipoModal\.imagenUrl\)\}\s+alt=\{selectedEquipoModal\.nombre\}\s+className="w-full h-full object-contain p-4"\s*\/>/g,
    <Image src={imagenCompleta(selectedEquipoModal.imagenUrl)} alt={selectedEquipoModal.nombre} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className="object-contain p-4" />
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed Catalogo');
};
fixCatalogo();