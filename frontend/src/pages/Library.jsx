import { useEffect, useState } from 'react';
import { Plus, X, Library as LibraryIcon, Trash2, BookCopy, Undo2 } from 'lucide-react';
import api from '../api/client';

const emptyBookForm = { title: '', author: '', category: '', total_copies: 1 };
const emptyLoanForm = { book_id: '', student_id: '', due_at: '' };

export default function Library() {
  const [tab, setTab] = useState('books'); // 'books' | 'loans'
  const [books, setBooks] = useState([]);
  const [loans, setLoans] = useState([]);
  const [students, setStudents] = useState([]);

  const [showBookModal, setShowBookModal] = useState(false);
  const [bookForm, setBookForm] = useState(emptyBookForm);
  const [bookError, setBookError] = useState('');

  const [showLoanModal, setShowLoanModal] = useState(false);
  const [loanForm, setLoanForm] = useState(emptyLoanForm);
  const [loanError, setLoanError] = useState('');

  const loadBooks = () => api.get('/library/books').then((res) => setBooks(res.data)).catch(() => {});
  const loadLoans = () => api.get('/library/loans', { params: { active: true } }).then((res) => setLoans(res.data)).catch(() => {});

  useEffect(() => {
    loadBooks();
    loadLoans();
    api.get('/students', { params: { limit: 500 } }).then((res) => setStudents(res.data.data)).catch(() => {});
  }, []);

  const handleAddBook = async (e) => {
    e.preventDefault();
    setBookError('');
    try {
      await api.post('/library/books', bookForm);
      setShowBookModal(false);
      setBookForm(emptyBookForm);
      loadBooks();
    } catch (err) {
      setBookError(err.response?.data?.message || 'Could not add book.');
    }
  };

  const handleDeleteBook = async (id) => {
    try {
      await api.delete(`/library/books/${id}`);
      loadBooks();
    } catch {
      // leave the row as-is if it fails (e.g. still on loan)
    }
  };

  const handleBorrow = async (e) => {
    e.preventDefault();
    setLoanError('');
    try {
      await api.post('/library/loans', loanForm);
      setShowLoanModal(false);
      setLoanForm(emptyLoanForm);
      loadLoans();
      loadBooks();
    } catch (err) {
      setLoanError(err.response?.data?.message || 'Could not record loan.');
    }
  };

  const handleReturn = async (id) => {
    try {
      await api.put(`/library/loans/${id}/return`);
      loadLoans();
      loadBooks();
    } catch {
      // leave the row as-is if it fails
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <LibraryIcon size={20} /> Library
          </h1>
          <p className="text-sm text-slate-500">{books.length} titles • {loans.length} currently borrowed</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setTab('books')}
            className={`text-sm px-4 py-2 rounded-lg font-medium ${tab === 'books' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            Books
          </button>
          <button onClick={() => setTab('loans')}
            className={`text-sm px-4 py-2 rounded-lg font-medium ${tab === 'loans' ? 'bg-brand-blue text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            Borrowed Books
          </button>
        </div>
      </div>

      {tab === 'books' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowBookModal(true)}
              className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
              <Plus size={16} /> Add Book
            </button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">Title</th>
                  <th className="px-4 py-3 font-medium">Author</th>
                  <th className="px-4 py-3 font-medium">Category</th>
                  <th className="px-4 py-3 font-medium">Available</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => (
                  <tr key={b.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{b.title}</td>
                    <td className="px-4 py-3 text-slate-600">{b.author || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{b.category || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{b.available_copies} / {b.total_copies}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleDeleteBook(b.id)} className="text-slate-400 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {!books.length && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No books in the library yet.</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {tab === 'loans' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowLoanModal(true)}
              className="flex items-center gap-2 bg-brand-blue text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-blue-700">
              <BookCopy size={16} /> Borrow Book
            </button>
          </div>
          {loanError && <p className="text-sm text-red-600">{loanError}</p>}
          <div className="bg-white rounded-xl border border-slate-200">
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="px-4 py-3 font-medium">Book</th>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Borrowed</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((l) => (
                  <tr key={l.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{l.title}</td>
                    <td className="px-4 py-3 text-slate-600">{l.student_name}</td>
                    <td className="px-4 py-3 text-slate-600">{new Date(l.borrowed_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-slate-600">{l.due_at ? new Date(l.due_at).toLocaleDateString() : '—'}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => handleReturn(l.id)} className="text-brand-blue text-xs font-medium hover:underline flex items-center gap-1">
                        <Undo2 size={12} /> Mark Returned
                      </button>
                    </td>
                  </tr>
                ))}
                {!loans.length && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-400">No books currently borrowed.</td></tr>
                )}
              </tbody>
            </table>
            </div>
          </div>
        </div>
      )}

      {showBookModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowBookModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Add Book</h2>
            <form onSubmit={handleAddBook} className="space-y-3">
              <input required placeholder="Title" value={bookForm.title}
                onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Author" value={bookForm.author}
                onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Category (e.g. Textbook)" value={bookForm.category}
                onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
              <input type="number" min="1" placeholder="Total Copies" value={bookForm.total_copies}
                onChange={(e) => setBookForm({ ...bookForm, total_copies: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {bookError && <p className="text-sm text-red-600">{bookError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Save Book
              </button>
            </form>
          </div>
        </div>
      )}

      {showLoanModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button onClick={() => setShowLoanModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X size={18} />
            </button>
            <h2 className="text-lg font-semibold mb-4">Borrow Book</h2>
            <form onSubmit={handleBorrow} className="space-y-3">
              <select required value={loanForm.book_id} onChange={(e) => setLoanForm({ ...loanForm, book_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select Book</option>
                {books.filter((b) => b.available_copies > 0).map((b) => (
                  <option key={b.id} value={b.id}>{b.title} ({b.available_copies} available)</option>
                ))}
              </select>
              <select required value={loanForm.student_id} onChange={(e) => setLoanForm({ ...loanForm, student_id: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Select Student</option>
                {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.admission_no})</option>)}
              </select>
              <input type="date" placeholder="Due Date (optional)" value={loanForm.due_at}
                onChange={(e) => setLoanForm({ ...loanForm, due_at: e.target.value })}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />

              {loanError && <p className="text-sm text-red-600">{loanError}</p>}

              <button type="submit" className="w-full bg-brand-blue text-white rounded-lg py-2.5 text-sm font-medium hover:bg-blue-700">
                Confirm Borrow
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}