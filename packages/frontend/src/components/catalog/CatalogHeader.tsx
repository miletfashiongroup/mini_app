type CatalogHeaderProps = {
  logoSrc: string;
};

const CatalogHeader = ({ logoSrc }: CatalogHeaderProps) => {
  return (
    <header className="px-4 py-4">
      <img src={logoSrc} alt="Brace" className="h-8 w-auto" draggable={false} />
    </header>
  );
};

export default CatalogHeader;
