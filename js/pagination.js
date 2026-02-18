// Pagination utilities
export class Paginator {
  constructor(items, itemsPerPage = 30) {
    this.items = items;
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
  }

  getTotalPages() {
    return Math.ceil(this.items.length / this.itemsPerPage);
  }

  getCurrentPageItems() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.items.slice(start, end);
  }

  goToPage(pageNum) {
    const max = this.getTotalPages();
    if (pageNum < 1) this.currentPage = 1;
    else if (pageNum > max) this.currentPage = max;
    else this.currentPage = pageNum;
  }

  nextPage() {
    this.goToPage(this.currentPage + 1);
  }

  prevPage() {
    this.goToPage(this.currentPage - 1);
  }

  setItemsPerPage(count) {
    this.itemsPerPage = count;
    this.currentPage = 1;
  }

  reset() {
    this.currentPage = 1;
  }
}
