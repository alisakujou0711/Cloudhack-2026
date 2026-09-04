import { useRef, useState } from 'react';
import { api } from '../../api/client';

const TYPE_LABELS = {
  resume: 'a resume',
  university_application: 'a university application document (transcript/GPA/extracurriculars)',
  essay: 'an essay / personal statement',
  cover_letter: 'a cover letter',
  unknown: 'an unclear document type',
};

// Self-contained upload widget: pick a file -> classify it -> if the prediction conflicts with
// what THIS panel expects, show a non-blocking confirmation (never auto-reject) -> hand the
// extracted text back to the parent panel.
export default function DocumentUploader({ expectedType, prompt, hint, onExtracted, onRemove }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(null); // { filename, text }
  const [pending, setPending] = useState(null); // classify result awaiting confirmation
  const fileInputRef = useRef(null);

  const applyResult = (result) => {
    setLoaded({ filename: result.filename, text: result.text });
    setPending(null);
    onExtracted(result.text, result.filename);
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const result = await api.classifyDocument(file);
      const mismatch =
        result.predictedType && result.predictedType !== 'unknown' && result.predictedType !== expectedType;
      if (mismatch) {
        setPending(result);
      } else {
        applyResult(result);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = () => {
    setLoaded(null);
    setPending(null);
    onRemove?.();
  };

  if (loaded) {
    return (
      <div className="loaded-file-card">
        <div className="loaded-file-info">
          <span className="loaded-file-icon">📄</span>
          <div>
            <div className="loaded-file-name">{loaded.filename}</div>
            <div className="loaded-file-meta">{loaded.text.length.toLocaleString()} characters extracted</div>
          </div>
        </div>
        <div className="loaded-file-actions">
          <button type="button" className="link-btn" onClick={handleRemove}>
            Upload a different file
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="doc-uploader">
      {prompt && <p className="doc-uploader-prompt">{prompt}</p>}
      <div className="file-upload-row">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
          onChange={handleFileChange}
          disabled={uploading}
        />
        {uploading && <span className="upload-status">Reading file…</span>}
      </div>
      {hint && <span className="field-hint">{hint}</span>}
      {error && <p className="error-text">{error}</p>}
      {pending && (
        <div className="mismatch-confirm">
          <p>
            ⚠️ This file looks like <strong>{TYPE_LABELS[pending.predictedType]}</strong>, not{' '}
            {TYPE_LABELS[expectedType]}. Continue anyway?
          </p>
          <div className="mismatch-confirm-actions">
            <button type="button" className="btn-ghost" onClick={() => setPending(null)}>
              Cancel
            </button>
            <button type="button" className="btn-primary" onClick={() => applyResult(pending)}>
              Continue anyway
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
