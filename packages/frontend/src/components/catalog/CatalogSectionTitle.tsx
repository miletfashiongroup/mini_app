type CatalogSectionTitleProps = {
  title: string;
};

const CatalogSectionTitle = ({ title }: CatalogSectionTitleProps) => {
  return (
    <div className="px-4 mt-4">
      <h2 className="text-[24px] font-bold leading-tight text-[#29292B]">{title}</h2>
    </div>
  );
};

export default CatalogSectionTitle;
