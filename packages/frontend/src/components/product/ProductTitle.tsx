type ProductTitleProps = {
  title: string;
};

const ProductTitle = ({ title }: ProductTitleProps) => {
  return (
    <div className="px-4 mt-4 mb-4">
      <h1 className="text-[22px] font-bold leading-tight text-[#29292B]">{title}</h1>
    </div>
  );
};

export default ProductTitle;
