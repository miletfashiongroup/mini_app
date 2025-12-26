type ProductTagsProps = {
  tags: string[];
};

const ProductTags = ({ tags }: ProductTagsProps) => {
  return (
    <div className="px-4 mt-3">
      <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tags.map((tag) => (
          <span
            key={tag}
            className="shrink-0 rounded-full bg-[#F3F3F7] px-2.5 py-1 text-[12px] font-medium leading-tight text-[#29292B]"
          >
            {tag}
          </span>
        ))}
      </div>
    </div>
  );
};

export default ProductTags;
