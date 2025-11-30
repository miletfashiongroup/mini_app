type ProductMoreReviewsLinkProps = {
  onClick?: () => void;
};

const ProductMoreReviewsLink = ({ onClick }: ProductMoreReviewsLinkProps) => {
  return (
    <div className="px-4 mt-4">
      <button
        type="button"
        onClick={onClick}
        className="flex items-center gap-2 text-[14px] font-medium text-[#29292B] transition duration-150 ease-out hover:text-[#1f1f21] active:scale-[0.97]"
      >
        <span>Больше отзывов</span>
        <span className="text-[14px]">⌄</span>
      </button>
    </div>
  );
};

export default ProductMoreReviewsLink;
