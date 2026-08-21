const fs = require('fs');

const fixImage = (filePath) => {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');
  
  if (!content.includes('import Image from 'next/image'')) {
    content = content.replace('use client';, 'use client';\nimport Image from 'next/image';);
  }

  // Replace catalog image (the one with the fallback error)
  const imgRegex = /<img\s+loading="lazy"\s+decoding="async"\s+src=\{imagenCompleta\(urlCatalogo\)\}[\s\S]*?className="([^"]+)"\s*\/>/g;
  
  content = content.replace(imgRegex, (match, className) => {
    return <Image src={imagenCompleta(urlCatalogo)} alt={p.nombre} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" className={"\ object-contain"} />;
  });

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed ' + filePath);
};

fixImage('src/app/equipos/page.tsx');
fixImage('src/app/renta/page.tsx');
fixImage('src/app/venta/page.tsx');