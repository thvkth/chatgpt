// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

console.log('script.js loaded');

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded');

  const fileInput = document.getElementById('fileInput');
  const questionInput = document.getElementById('questionInput');
  const submitButton = document.getElementById('submitQuestion');
  const answerOutput = document.getElementById('answerOutput');

  if (!fileInput || !questionInput || !submitButton || !answerOutput) {
    console.error('DOM elements missing:', { fileInput, questionInput, submitButton, answerOutput });
    alert('Error: Page elements failed to load. Check console.');
    if (answerOutput) answerOutput.innerHTML = 'Error: Page elements failed to load.';
    return;
  }

  console.log('All DOM elements found');

  submitButton.addEventListener('click', async () => {
    console.log('Get Answer button clicked');
    answerOutput.innerHTML = 'Processing...';

    // Validate inputs
    if (!fileInput.files.length) {
      console.log('No files uploaded');
      answerOutput.innerHTML = 'Error: Please upload at least one file.';
      return;
    }

    if (!questionInput.value.trim()) {
      console.log('No question provided');
      answerOutput.innerHTML = 'Error: Please enter a question.';
      return;
    }

    let fileContent = '';
    let filesProcessed = 0;

    for (const file of fileInput.files) {
      console.log(`Processing file: ${file.name}, type: ${file.type}`);
      try {
        if (file.type === 'application/pdf') {
          console.log(`Loading PDF: ${file.name}`);
          const arrayBuffer = await file.arrayBuffer();
          let pdfText = '';
          try {
            const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
            console.log(`PDF loaded, pages: ${pdf.numPages}`);
            for (let i = 1; i <= pdf.numPages; i++) {
              const page = await pdf.getPage(i);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map(item => item.str).join(' ');
              console.log(`Page ${i} text length: ${pageText.length}`);
              pdfText += pageText + '\n';
            }
            if (!pdfText.trim()) {
              console.warn(`No text extracted from PDF: ${file.name}`);
              answerOutput.innerHTML = `Warning: No text extracted from PDF: ${file.name}. It may be a scanned image.`;
              continue;
            }
            fileContent += pdfText + '\n';
          } catch (pdfError) {
            console.error(`PDF processing error for ${file.name}:`, pdfError);
            answerOutput.innerHTML = `Error processing PDF file: ${file.name}. It may be a scanned image or corrupted.`;
            return;
          }
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          console.log(`Loading DOCX: ${file.name}`);
          const arrayBuffer = await file.arrayBuffer();
          const result = await mammoth.extractRawText({ arrayBuffer });
          fileContent += result.value + '\n';
        } else if (file.type.startsWith('text/') || ['.csv', '.md', '.json'].some(ext => file.name.toLowerCase().endsWith(ext))) {
          console.log(`Loading text-based file: ${file.name}`);
          const text = await file.text();
          fileContent += text + '\n';
        } else {
          console.log(`Attempting fallback text read for: ${file.name}`);
          try {
            const text = await file.text();
            fileContent += text + '\n';
          } catch {
            console.warn(`Unsupported file type for ${file.name}, skipping.`);
            continue;
          }
        }
        filesProcessed++;
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        answerOutput.innerHTML = `Error processing file: ${file.name}`;
        return;
      }
    }

    if (filesProcessed === 0) {
      console.log('No files successfully processed');
      answerOutput.innerHTML = 'Error: No files could be processed. Please ensure files are valid and contain text.';
      return;
    }

    console.log(`Total extracted content length: ${fileContent.length}`);
    const answer = generateAnswer(fileContent, questionInput.value.trim());
    answerOutput.innerHTML = answer || "ans can't be generated cuz the file doesn't your file(s) provided doesn't contain question-related information.";
});

function generateAnswer(content, question) {
  console.log(`Generating answer for question: ${question}`);
  const lowerContent = content.toLowerCase();
  const lowerQuestion = question.toLowerCase();
  const sentences = lowerContent.split('\n').filter(s => s.trim());

  const keywords = lowerQuestion.split(/\s+/);
  console.log(`Keywords: ${keywords}`);
  for (const sentence of sentences) {
    if (keywords.some(keyword => sentence.includes(keyword))) {
      console.log(`Found matching sentence: ${sentence}`);
      return sentence;
    }
  }
  console.log('No matching content found');
  return null;
}
