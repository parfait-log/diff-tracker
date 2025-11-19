import React, { useState, useRef, useEffect } from 'react';
import { Upload, FileText, ArrowUp, ArrowDown, X } from 'lucide-react';
import * as mammoth from 'mammoth';

function App() {
  const [originalText, setOriginalText] = useState('');
  const [modifiedText, setModifiedText] = useState('');
  const [diffResult, setDiffResult] = useState(null);
  const [currentHighlight, setCurrentHighlight] = useState(-1);
  const diffContainerRef = useRef(null);
  const highlightRefs = useRef([]);

  // 글자 단위 차이 계산 (Dynamic Programming - Levenshtein)
  const computeDiff = (text1, text2) => {
    const len1 = text1.length;
    const len2 = text2.length;
    const dp = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));
    
    // DP 테이블 채우기
    for (let i = 0; i <= len1; i++) dp[i][0] = i;
    for (let j = 0; j <= len2; j++) dp[0][j] = j;
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        if (text1[i-1] === text2[j-1]) {
          dp[i][j] = dp[i-1][j-1];
        } else {
          dp[i][j] = Math.min(
            dp[i-1][j] + 1,    // 삭제
            dp[i][j-1] + 1,    // 삽입
            dp[i-1][j-1] + 1   // 교체
          );
        }
      }
    }
    
    // 역추적하여 변경사항 추출
    const changes = [];
    let i = len1, j = len2;
    
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && text1[i-1] === text2[j-1]) {
        changes.unshift({ type: 'equal', char: text1[i-1] });
        i--; j--;
      } else if (j > 0 && (i === 0 || dp[i][j-1] <= dp[i-1][j])) {
        changes.unshift({ type: 'insert', char: text2[j-1] });
        j--;
      } else if (i > 0) {
        changes.unshift({ type: 'delete', char: text1[i-1] });
        i--;
      }
    }
    
    return changes;
  };

  // 변경사항 그룹화 및 통계 계산
  const analyzeDiff = () => {
    if (!originalText && !modifiedText) {
      setDiffResult(null);
      return;
    }

    const changes = computeDiff(originalText, modifiedText);
    const groups = [];
    let currentGroup = null;
    let changeIndex = 0;

    changes.forEach((change) => {
      if (change.type === 'equal') {
        if (currentGroup) {
          currentGroup.id = changeIndex++;
          groups.push(currentGroup);
          currentGroup = null;
        }
        groups.push(change);
      } else {
        if (!currentGroup) {
          currentGroup = { type: 'change', deleted: '', inserted: '' };
        }
        if (change.type === 'delete') {
          currentGroup.deleted += change.char;
        } else {
          currentGroup.inserted += change.char;
        }
      }
    });

    if (currentGroup) {
      currentGroup.id = changeIndex++;
      groups.push(currentGroup);
    }

    const stats = {
      total: groups.filter(g => g.type === 'change').length,
      insertions: changes.filter(c => c.type === 'insert').length,
      deletions: changes.filter(c => c.type === 'delete').length
    };

    setDiffResult({ groups, stats });
    setCurrentHighlight(-1);
  };

  useEffect(() => {
    analyzeDiff();
  }, [originalText, modifiedText]);

  // 워드 문서 읽기
  const handleFileUpload = async (file, setTextFunc) => {
    if (!file) return;

    if (file.name.endsWith('.docx')) {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        setTextFunc(result.value);
      } catch (error) {
        alert('워드 문서를 읽을 수 없습니다: ' + error.message);
      }
    } else if (file.name.endsWith('.txt')) {
      const text = await file.text();
      setTextFunc(text);
    } else {
      alert('지원되는 파일 형식: .docx, .txt');
    }
  };

  // 네비게이션
  const navigateChange = (direction) => {
    if (!diffResult || diffResult.stats.total === 0) return;

    let nextIndex = currentHighlight + direction;
    if (nextIndex < 0) nextIndex = diffResult.stats.total - 1;
    if (nextIndex >= diffResult.stats.total) nextIndex = 0;

    setCurrentHighlight(nextIndex);

    // 스크롤
    setTimeout(() => {
      if (highlightRefs.current[nextIndex]) {
        highlightRefs.current[nextIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }, 50);
  };

  // 렌더링
  const renderDiff = () => {
    if (!diffResult) return null;

    highlightRefs.current = [];
    let changeCounter = 0;

    return diffResult.groups.map((item, idx) => {
      if (item.type === 'equal') {
        return <span key={idx}>{item.char}</span>;
      } else {
        const isHighlighted = changeCounter === currentHighlight;
        const ref = (el) => { if (el) highlightRefs.current[changeCounter] = el; };
        changeCounter++;

        return (
          <span
            key={idx}
            ref={ref}
            className={`inline ${isHighlighted ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
          >
            {item.deleted && (
              <span className="bg-red-200 text-red-800 line-through">
                {item.deleted}
              </span>
            )}
            {item.inserted && (
              <span className="bg-green-200 text-green-800 underline decoration-2">
                {item.inserted}
              </span>
            )}
          </span>
        );
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">문서 변경사항 추적기</h1>
          <p className="text-gray-600 mb-4">텍스트와 워드 문서의 변경사항을 글자 단위로 비교합니다</p>

          {/* 통계 */}
          {diffResult && (
            <div className="flex gap-4 mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-blue-600">{diffResult.stats.total}</div>
                <div className="text-sm text-gray-600">총 변경사항</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-green-600">{diffResult.stats.insertions}</div>
                <div className="text-sm text-gray-600">추가된 글자</div>
              </div>
              <div className="flex-1 text-center">
                <div className="text-2xl font-bold text-red-600">{diffResult.stats.deletions}</div>
                <div className="text-sm text-gray-600">삭제된 글자</div>
              </div>
            </div>
          )}

          {/* 네비게이션 */}
          {diffResult && diffResult.stats.total > 0 && (
            <div className="flex items-center justify-center gap-3 mb-6 p-3 bg-gray-100 rounded-lg">
              <button
                onClick={() => navigateChange(-1)}
                className="p-2 bg-white rounded-lg hover:bg-blue-50 transition-colors"
                title="이전 변경사항"
              >
                <ArrowUp className="w-5 h-5 text-gray-700" />
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-[120px] text-center">
                {currentHighlight >= 0 ? `${currentHighlight + 1} / ${diffResult.stats.total}` : '변경사항 선택'}
              </span>
              <button
                onClick={() => navigateChange(1)}
                className="p-2 bg-white rounded-lg hover:bg-blue-50 transition-colors"
                title="다음 변경사항"
              >
                <ArrowDown className="w-5 h-5 text-gray-700" />
              </button>
            </div>
          )}

          {/* 입력 영역 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* 원본 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-gray-700">원본 문서</label>
                <div className="flex gap-2">
                  <label className="cursor-pointer px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center gap-1">
                    <Upload className="w-4 h-4" />
                    파일 업로드
                    <input
                      type="file"
                      accept=".txt,.docx"
                      onChange={(e) => handleFileUpload(e.target.files[0], setOriginalText)}
                      className="hidden"
                    />
                  </label>
                  {originalText && (
                    <button
                      onClick={() => setOriginalText('')}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      지우기
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={originalText}
                onChange={(e) => setOriginalText(e.target.value)}
                placeholder="원본 텍스트를 입력하거나 파일을 업로드하세요..."
                className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              />
            </div>

            {/* 수정본 */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-semibold text-gray-700">수정된 문서</label>
                <div className="flex gap-2">
                  <label className="cursor-pointer px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm flex items-center gap-1">
                    <Upload className="w-4 h-4" />
                    파일 업로드
                    <input
                      type="file"
                      accept=".txt,.docx"
                      onChange={(e) => handleFileUpload(e.target.files[0], setModifiedText)}
                      className="hidden"
                    />
                  </label>
                  {modifiedText && (
                    <button
                      onClick={() => setModifiedText('')}
                      className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm flex items-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      지우기
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={modifiedText}
                onChange={(e) => setModifiedText(e.target.value)}
                placeholder="수정된 텍스트를 입력하거나 파일을 업로드하세요..."
                className="w-full h-64 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* 비교 결과 */}
        {diffResult && (originalText || modifiedText) && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">변경사항 표시</h2>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded border border-gray-200">
              <div className="flex gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-green-200 text-green-800 rounded underline decoration-2">추가</span>
                  <span className="text-gray-600">추가된 텍스트</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-red-200 text-red-800 rounded line-through">삭제</span>
                  <span className="text-gray-600">삭제된 텍스트</span>
                </div>
              </div>
            </div>

            <div
              ref={diffContainerRef}
              className="p-6 bg-white border border-gray-200 rounded-lg whitespace-pre-wrap font-mono text-sm leading-relaxed max-h-[600px] overflow-y-auto"
            >
              {renderDiff()}
            </div>
          </div>
        )}

        {!originalText && !modifiedText && (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg">문서를 입력하거나 업로드하여 비교를 시작하세요</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
