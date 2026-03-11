/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { create, all } from 'mathjs';
import { GoogleGenAI } from "@google/genai";
import { 
  Calculator, 
  Sparkles, 
  History, 
  Trash2, 
  Delete, 
  ChevronRight, 
  Info,
  Settings,
  X,
  MessageSquare,
  Send,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';

// Initialize mathjs
const math = create(all);

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

export default function App() {
  const [display, setDisplay] = useState('0');
  const [expression, setExpression] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const aiInputRef = useRef<HTMLInputElement>(null);

  // Handle button clicks
  const handleButtonClick = (value: string) => {
    if (display === 'Error') setDisplay('0');
    
    if (value === 'AC') {
      setDisplay('0');
      setExpression('');
    } else if (value === 'DEL') {
      if (display.length > 1) {
        setDisplay(display.slice(0, -1));
      } else {
        setDisplay('0');
      }
    } else if (value === '=') {
      calculateResult();
    } else {
      if (display === '0' && !['+', '-', '*', '/', '.', '^'].includes(value)) {
        setDisplay(value);
      } else {
        setDisplay(display + value);
      }
    }
  };

  const calculateResult = () => {
    try {
      // Replace symbols for mathjs
      const sanitizedExpression = display
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'pi')
        .replace(/e/g, 'e')
        .replace(/√\(/g, 'sqrt(')
        .replace(/sin\(/g, 'sin(')
        .replace(/cos\(/g, 'cos(')
        .replace(/tan\(/g, 'tan(')
        .replace(/log\(/g, 'log10(')
        .replace(/ln\(/g, 'log(');

      const result = math.evaluate(sanitizedExpression);
      const formattedResult = Number.isInteger(result) ? result.toString() : result.toFixed(8).replace(/\.?0+$/, '');
      
      const newItem: HistoryItem = {
        id: Math.random().toString(36).substr(2, 9),
        expression: display,
        result: formattedResult,
        timestamp: Date.now(),
      };

      setHistory([newItem, ...history].slice(0, 20));
      setDisplay(formattedResult);
      setExpression(display + ' =');
    } catch (error) {
      setDisplay('Error');
    }
  };

  const handleAiSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!aiInput.trim()) return;

    setIsAiLoading(true);
    setAiResponse(null);

    try {
      const response = await genAI.models.generateContent({ 
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: aiInput }] }],
        config: {
          systemInstruction: "You are a scientific calculator assistant. Solve the user's math problem step-by-step. Provide the final numerical result clearly. Use markdown for formatting. If the user asks for a calculation, explain the steps briefly."
        }
      });

      const text = response.text;
      setAiResponse(text || "No response generated.");
      
      // Try to extract a numerical result for the calculator display if possible
      if (text) {
        const numberMatch = text.match(/result is[:\s]*([\d.-]+)/i) || text.match(/= ([\d.-]+)/);
        if (numberMatch && numberMatch[1]) {
          setDisplay(numberMatch[1]);
        }
      }
    } catch (error) {
      setAiResponse("Sorry, I couldn't process that math request. Please try again.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const scientificButtons = [
    { label: 'sin', value: 'sin(' },
    { label: 'cos', value: 'cos(' },
    { label: 'tan', value: 'tan(' },
    { label: '√', value: '√(' },
    { label: 'log', value: 'log(' },
    { label: 'ln', value: 'ln(' },
    { label: 'π', value: 'π' },
    { label: 'e', value: 'e' },
    { label: '^', value: '^' },
    { label: '(', value: '(' },
    { label: ')', value: ')' },
    { label: '!', value: '!' },
  ];

  const mainButtons = [
    { label: '7', value: '7' }, { label: '8', value: '8' }, { label: '9', value: '9' }, { label: '÷', value: '÷', color: 'text-orange-500' },
    { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' }, { label: '×', value: '×', color: 'text-orange-500' },
    { label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }, { label: '-', value: '-', color: 'text-orange-500' },
    { label: '0', value: '0' }, { label: '.', value: '.' }, { label: '=', value: '=', color: 'bg-orange-500 text-white rounded-lg' }, { label: '+', value: '+', color: 'text-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-[#E6E6E6] flex items-center justify-center p-4 font-sans text-[#151619]">
      {/* Main Container */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl bg-[#151619] rounded-[32px] shadow-2xl overflow-hidden flex flex-col md:flex-row border border-white/10"
      >
        
        {/* Left Side: Calculator */}
        <div className="flex-1 p-8 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="text-[#8E9299] hover:text-white transition-colors"
                title="History"
              >
                <History size={20} />
              </button>
              <button 
                onClick={() => setIsAiMode(!isAiMode)}
                className={`transition-colors ${isAiMode ? 'text-orange-500' : 'text-[#8E9299] hover:text-white'}`}
                title="AI Mode"
              >
                <Sparkles size={20} />
              </button>
            </div>
          </div>

          {/* Display Area */}
          <div className="bg-[#1C1D21] rounded-2xl p-6 mb-8 border border-white/5 flex flex-col items-end justify-end min-h-[140px] relative overflow-hidden">
            <div className="absolute top-4 left-4 text-[10px] font-mono tracking-widest text-[#8E9299] uppercase">
              Scientific Instrument v1.0
            </div>
            <div className="text-[#8E9299] text-sm font-mono mb-2 h-6 overflow-hidden text-ellipsis w-full text-right">
              {expression}
            </div>
            <div className="text-white text-5xl font-mono tracking-tighter truncate w-full text-right">
              {display}
            </div>
          </div>

          {/* Scientific Buttons */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {scientificButtons.map((btn) => (
              <button
                key={btn.label}
                onClick={() => handleButtonClick(btn.value)}
                className="h-10 bg-[#1C1D21] text-[#8E9299] rounded-lg text-xs font-mono hover:bg-[#2A2B30] hover:text-white transition-all active:scale-95 border border-white/5"
              >
                {btn.label}
              </button>
            ))}
          </div>

          {/* Main Buttons */}
          <div className="grid grid-cols-4 gap-3">
            <button
              onClick={() => handleButtonClick('AC')}
              className="h-14 bg-[#2A2B30] text-red-400 rounded-lg text-lg font-mono hover:bg-red-500/10 transition-all active:scale-95 border border-white/5"
            >
              AC
            </button>
            <button
              onClick={() => handleButtonClick('DEL')}
              className="h-14 bg-[#2A2B30] text-[#8E9299] rounded-lg flex items-center justify-center hover:bg-[#3A3B40] transition-all active:scale-95 border border-white/5"
            >
              <Delete size={20} />
            </button>
            <div className="col-span-2" />
            
            {mainButtons.map((btn) => (
              <button
                key={btn.label}
                onClick={() => handleButtonClick(btn.value)}
                className={`h-14 text-xl font-mono transition-all active:scale-95 flex items-center justify-center
                  ${btn.color || 'bg-[#1C1D21] text-white hover:bg-[#2A2B30] border border-white/5 rounded-lg'}
                `}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: AI & History Panel */}
        <div className="w-full md:w-[380px] bg-[#1C1D21] border-l border-white/10 flex flex-col">
          
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button 
              onClick={() => setIsAiMode(true)}
              className={`flex-1 py-4 text-xs font-mono uppercase tracking-widest transition-colors ${isAiMode ? 'text-orange-500 border-b-2 border-orange-500' : 'text-[#8E9299]'}`}
            >
              AI Assistant
            </button>
            <button 
              onClick={() => setIsAiMode(false)}
              className={`flex-1 py-4 text-xs font-mono uppercase tracking-widest transition-colors ${!isAiMode ? 'text-orange-500 border-b-2 border-orange-500' : 'text-[#8E9299]'}`}
            >
              History
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <AnimatePresence mode="wait">
              {isAiMode ? (
                <motion.div 
                  key="ai"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <h3 className="text-white text-sm font-mono flex items-center gap-2">
                      <Sparkles size={16} className="text-orange-500" />
                      Ask AI Anything
                    </h3>
                    <p className="text-[#8E9299] text-[10px] uppercase tracking-wider">
                      Solve equations, word problems, or explain concepts.
                    </p>
                  </div>

                  <form onSubmit={handleAiSubmit} className="relative">
                    <input 
                      ref={aiInputRef}
                      type="text"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder="e.g. Solve for x: 2x + 5 = 15"
                      className="w-full bg-[#151619] border border-white/10 rounded-xl py-3 pl-4 pr-12 text-white text-sm focus:outline-none focus:border-orange-500 transition-colors"
                    />
                    <button 
                      type="submit"
                      disabled={isAiLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center text-white hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                      {isAiLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    </button>
                  </form>

                  {aiResponse && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-[#151619] border border-white/10 rounded-xl p-4 text-sm text-[#8E9299] prose prose-invert prose-sm max-w-none"
                    >
                      <Markdown>{aiResponse}</Markdown>
                    </motion.div>
                  )}

                  {!aiResponse && !isAiLoading && (
                    <div className="space-y-3 pt-4">
                      <p className="text-[10px] text-[#8E9299] uppercase tracking-widest">Suggestions</p>
                      {[
                        "What is the derivative of x^2?",
                        "Calculate the area of a circle with radius 5",
                        "Convert 50 miles to kilometers",
                        "Explain the Pythagorean theorem"
                      ].map((suggestion) => (
                        <button 
                          key={suggestion}
                          onClick={() => {
                            setAiInput(suggestion);
                            aiInputRef.current?.focus();
                          }}
                          className="w-full text-left p-3 bg-[#151619] hover:bg-[#2A2B30] border border-white/5 rounded-lg text-xs text-[#8E9299] transition-colors flex items-center justify-between group"
                        >
                          {suggestion}
                          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="history"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white text-sm font-mono flex items-center gap-2">
                      <History size={16} className="text-orange-500" />
                      Recent Calculations
                    </h3>
                    {history.length > 0 && (
                      <button 
                        onClick={() => setHistory([])}
                        className="text-[#8E9299] hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-[#8E9299] space-y-4">
                      <div className="w-12 h-12 rounded-full bg-[#151619] flex items-center justify-center border border-white/5">
                        <Calculator size={24} opacity={0.5} />
                      </div>
                      <p className="text-xs font-mono uppercase tracking-widest">No history yet</p>
                    </div>
                  ) : (
                    history.map((item) => (
                      <button 
                        key={item.id}
                        onClick={() => setDisplay(item.result)}
                        className="w-full text-right p-4 bg-[#151619] hover:bg-[#2A2B30] border border-white/5 rounded-xl transition-all group"
                      >
                        <div className="text-[#8E9299] text-[10px] font-mono mb-1 group-hover:text-white transition-colors">
                          {item.expression}
                        </div>
                        <div className="text-white text-lg font-mono">
                          {item.result}
                        </div>
                      </button>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer Status */}
          <div className="p-4 border-t border-white/10 bg-[#151619] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-mono text-[#8E9299] uppercase tracking-widest">System Ready</span>
            </div>
            <div className="text-[10px] font-mono text-[#8E9299]">
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>
      </motion.div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.2);
        }
        
        .prose-sm {
          font-size: 0.8rem;
          line-height: 1.4;
        }
        .prose p {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .prose code {
          color: #F27D26;
          background: rgba(242, 125, 38, 0.1);
          padding: 0.1em 0.3em;
          border-radius: 0.2em;
        }
      `}</style>
    </div>
  );
}
