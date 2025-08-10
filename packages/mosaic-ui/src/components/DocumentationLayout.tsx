import React, { useState, useEffect } from 'react';
import './DocumentationLayout.css';

interface SidebarItem {
  id: string;
  title: string;
  href?: string;
  children?: SidebarItem[];
  active?: boolean;
}

interface Breadcrumb {
  label: string;
  href?: string;
}

interface DocumentationLayoutProps {
  sidebar: SidebarItem[];
  breadcrumbs?: Breadcrumb[];
  children: React.ReactNode;
  onSearch?: (query: string) => void;
  currentVersion?: string;
  versions?: string[];
  onVersionChange?: (version: string) => void;
}

export const DocumentationLayout: React.FC<DocumentationLayoutProps> = ({
  sidebar,
  breadcrumbs = [],
  children,
  onSearch,
  currentVersion = 'v0.1.0',
  versions = ['v0.1.0'],
  onVersionChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [activeSection, setActiveSection] = useState<string>('');

  // Track scroll position for table of contents
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[data-section]');
      let currentSection = '';
      
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 100) {
          currentSection = section.getAttribute('data-section') || '';
        }
      });
      
      setActiveSection(currentSection);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(searchQuery);
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const renderSidebarItem = (item: SidebarItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.has(item.id);
    const isActive = item.active || activeSection === item.id;

    return (
      <div key={item.id} className="sidebar-item-wrapper">
        <div 
          className={`sidebar-item level-${level} ${isActive ? 'active' : ''}`}
          style={{ paddingLeft: `${16 + level * 16}px` }}
        >
          {hasChildren && (
            <button
              className="sidebar-expand"
              onClick={() => toggleExpanded(item.id)}
              aria-expanded={isExpanded}
              aria-label={`Toggle ${item.title}`}
            >
              <svg 
                width="12" 
                height="12" 
                viewBox="0 0 12 12" 
                className={`sidebar-expand-icon ${isExpanded ? 'expanded' : ''}`}
              >
                <path 
                  d="M4 2 L8 6 L4 10" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                />
              </svg>
            </button>
          )}
          <a 
            href={item.href || `#${item.id}`}
            className="sidebar-link"
            data-active={isActive}
          >
            {item.title}
          </a>
        </div>
        {hasChildren && isExpanded && (
          <div className="sidebar-children">
            {item.children!.map(child => renderSidebarItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="docs-layout">
      {/* Mobile Sidebar Toggle */}
      <button
        className="docs-sidebar-toggle"
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label="Toggle sidebar"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
          <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
        </svg>
      </button>

      {/* Sidebar */}
      <aside className={`docs-sidebar ${isSidebarOpen ? 'open' : ''}`}>
        <div className="docs-sidebar-header">
          {/* Search */}
          <form onSubmit={handleSearch} className="docs-search">
            <input
              type="search"
              placeholder="Search docs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="docs-search-input"
              aria-label="Search documentation"
            />
            <svg 
              width="16" 
              height="16" 
              viewBox="0 0 16 16" 
              className="docs-search-icon"
              fill="currentColor"
            >
              <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
            </svg>
          </form>

          {/* Version Selector */}
          {versions.length > 1 && (
            <select
              value={currentVersion}
              onChange={(e) => onVersionChange?.(e.target.value)}
              className="docs-version-select"
              aria-label="Select version"
            >
              {versions.map(version => (
                <option key={version} value={version}>{version}</option>
              ))}
            </select>
          )}
        </div>

        {/* Navigation */}
        <nav className="docs-sidebar-nav">
          {sidebar.map(item => renderSidebarItem(item))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="docs-main">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="docs-breadcrumbs" aria-label="Breadcrumb">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="docs-breadcrumb-separator">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="docs-breadcrumb-link">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="docs-breadcrumb-current">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Content */}
        <div className="docs-content">
          {children}
        </div>

        {/* Table of Contents (for desktop) */}
        <aside className="docs-toc">
          <h3 className="docs-toc-title">On this page</h3>
          <nav className="docs-toc-nav">
            {/* This would be populated dynamically based on headings */}
            <a href="#overview" className={`docs-toc-link ${activeSection === 'overview' ? 'active' : ''}`}>
              Overview
            </a>
            <a href="#installation" className={`docs-toc-link ${activeSection === 'installation' ? 'active' : ''}`}>
              Installation
            </a>
            <a href="#usage" className={`docs-toc-link ${activeSection === 'usage' ? 'active' : ''}`}>
              Usage
            </a>
            <a href="#api" className={`docs-toc-link ${activeSection === 'api' ? 'active' : ''}`}>
              API Reference
            </a>
          </nav>
        </aside>
      </main>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="docs-overlay"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}
    </div>
  );
};