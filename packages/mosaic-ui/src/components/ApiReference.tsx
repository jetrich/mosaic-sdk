import React, { useState } from 'react';
import { CodePlayground } from './CodePlayground';
import './ApiReference.css';

interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  defaultValue?: string;
}

interface ApiMethod {
  id: string;
  name: string;
  description: string;
  signature: string;
  parameters: ApiParameter[];
  returnType: string;
  returnDescription: string;
  example: string;
  category: string;
  deprecated?: boolean;
  version?: string;
}

interface ApiReferenceProps {
  methods: ApiMethod[];
  className?: string;
}

export const ApiReference: React.FC<ApiReferenceProps> = ({
  methods,
  className = ''
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedMethods, setExpandedMethods] = useState<Set<string>>(new Set());

  // Get unique categories
  const categories = ['all', ...Array.from(new Set(methods.map(method => method.category)))];

  // Filter methods based on category and search
  const filteredMethods = methods.filter(method => {
    const matchesCategory = selectedCategory === 'all' || method.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      method.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      method.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleMethodExpansion = (methodId: string) => {
    const newExpanded = new Set(expandedMethods);
    if (newExpanded.has(methodId)) {
      newExpanded.delete(methodId);
    } else {
      newExpanded.add(methodId);
    }
    setExpandedMethods(newExpanded);
  };

  const renderParameterType = (type: string) => {
    return <span className="param-type">{type}</span>;
  };

  return (
    <div className={`api-reference ${className}`}>
      {/* Header */}
      <div className="api-reference-header">
        <h2 className="api-reference-title">API Reference</h2>
        <p className="api-reference-description">
          Complete reference for all MosAIc SDK methods and interfaces.
        </p>
      </div>

      {/* Controls */}
      <div className="api-reference-controls">
        <div className="api-search">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" className="search-icon">
            <path d="M11.5 7a4.499 4.499 0 11-8.998 0A4.499 4.499 0 0111.5 7zm-.82 4.74a6 6 0 111.06-1.06l3.04 3.04a.75.75 0 11-1.06 1.06l-3.04-3.04z"/>
          </svg>
          <input
            type="text"
            placeholder="Search methods..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="api-categories">
          {categories.map(category => (
            <button
              key={category}
              className={`category-button ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Methods List */}
      <div className="api-methods">
        {filteredMethods.length === 0 ? (
          <div className="no-results">
            <p>No methods found matching your criteria.</p>
          </div>
        ) : (
          filteredMethods.map(method => {
            const isExpanded = expandedMethods.has(method.id);
            
            return (
              <div key={method.id} className={`api-method ${isExpanded ? 'expanded' : ''}`}>
                <div 
                  className="api-method-header"
                  onClick={() => toggleMethodExpansion(method.id)}
                >
                  <div className="method-info">
                    <h3 className="method-name">
                      {method.name}
                      {method.deprecated && (
                        <span className="method-deprecated">deprecated</span>
                      )}
                      {method.version && (
                        <span className="method-version">v{method.version}</span>
                      )}
                    </h3>
                    <p className="method-description">{method.description}</p>
                    <div className="method-signature">
                      <code>{method.signature}</code>
                    </div>
                  </div>
                  
                  <button className="expand-button">
                    <svg 
                      width="16" 
                      height="16" 
                      viewBox="0 0 16 16" 
                      fill="currentColor"
                      className={`expand-icon ${isExpanded ? 'expanded' : ''}`}
                    >
                      <path d="M8.22 2.97a.75.75 0 011.06 0l4.25 4.25a.75.75 0 010 1.06l-4.25 4.25a.75.75 0 01-1.06-1.06L11.44 8 8.22 4.78a.75.75 0 010-1.06z"/>
                    </svg>
                  </button>
                </div>

                {isExpanded && (
                  <div className="api-method-details">
                    {/* Parameters */}
                    {method.parameters.length > 0 && (
                      <div className="method-section">
                        <h4 className="section-title">Parameters</h4>
                        <div className="parameters-table">
                          <div className="table-header">
                            <div className="header-name">Name</div>
                            <div className="header-type">Type</div>
                            <div className="header-required">Required</div>
                            <div className="header-description">Description</div>
                          </div>
                          {method.parameters.map((param, index) => (
                            <div key={index} className="parameter-row">
                              <div className="param-name">
                                <code>{param.name}</code>
                              </div>
                              <div className="param-type-cell">
                                {renderParameterType(param.type)}
                              </div>
                              <div className="param-required">
                                {param.required ? (
                                  <span className="required-yes">Yes</span>
                                ) : (
                                  <span className="required-no">No</span>
                                )}
                              </div>
                              <div className="param-description">
                                {param.description}
                                {param.defaultValue && (
                                  <div className="param-default">
                                    Default: <code>{param.defaultValue}</code>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Return Value */}
                    <div className="method-section">
                      <h4 className="section-title">Returns</h4>
                      <div className="return-info">
                        <div className="return-type">
                          {renderParameterType(method.returnType)}
                        </div>
                        <div className="return-description">
                          {method.returnDescription}
                        </div>
                      </div>
                    </div>

                    {/* Example */}
                    <div className="method-section">
                      <h4 className="section-title">Example</h4>
                      <CodePlayground
                        initialCode={method.example}
                        language="typescript"
                        filename={`${method.name}-example.ts`}
                        runnable={true}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};