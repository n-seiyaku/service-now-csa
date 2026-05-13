const fs = require('fs');

try {
  const data = JSON.parse(fs.readFileSync('c:/Users/user/nhan/csa/src/assessments/test.json', 'utf8'));
  const questions = data.pageProps.questions;

  const result = questions.map(q => {
    const isMultipleChoice = q.answer.length === 1;
    const assessment_type = isMultipleChoice ? "multiple-choice" : "multi-select";
    
    let questionHtml = q.question_text;
    if (q.question_images && q.question_images.length > 0) {
      const imagesHtml = q.question_images.map(img => `<p><img src="${img}"></p>`).join('');
      questionHtml = `<p>${q.question_text}</p>${imagesHtml}`;
    }

    // sort keys to ensure A, B, C, D order
    const choiceKeys = Object.keys(q.choices || {}).sort();
    const answers = choiceKeys.map(k => q.choices[k]);

    const correct_response = (q.answer || "").split('').map(char => char.toLowerCase());

    return {
      assessment_type,
      prompt: {
        question: questionHtml,
        feedbacks: [],
        answers: answers
      },
      correct_response,
      question_plain: q.question_text
    };
  });

  fs.writeFileSync('c:/Users/user/nhan/csa/src/assessments/test-1.json', JSON.stringify(result, null, 2));
  console.log("File created successfully.");
} catch (error) {
  console.error("Error:", error);
}
