import React, { useContext } from 'react';
import { WhiteboardContext } from '../../context/WhiteboardContext';
import './PageNavigation.css';

const PageNavigation = () => {
  const { currentPage, changePage, pages } = useContext(WhiteboardContext);
  
  const handlePageChange = (pageNumber) => {
    changePage(pageNumber);
  };
  
  const handleAddPage = () => {
    const newPageNumber = Object.keys(pages).length + 1;
    changePage(newPageNumber);
  };
  
  return (
    <div className="page-navigation">
      <div className="page-list">
        {Object.keys(pages).map((pageNumber) => (
          <button
            key={pageNumber}
            className={`page-button ${parseInt(pageNumber) === currentPage ? 'active' : ''}`}
            onClick={() => handlePageChange(parseInt(pageNumber))}
          >
            {pageNumber}
          </button>
        ))}
        <button className="add-page-button" onClick={handleAddPage}>
          <i className="fas fa-plus"></i>
        </button>
      </div>
    </div>
  );
};

export default PageNavigation;