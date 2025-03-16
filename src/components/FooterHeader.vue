<template>
    <footer class="desktop-header">
      <div class="remove-padding-smartphone" style="width: 100%; justify-content: space-between; height: fit-content; min-height: 48px; padding: 0 48px; display: flex;">
        <div style="width: fit-content; height: 100%; display: flex; align-items: center; margin: auto; color: #FAFAFA;">
          Wersja 1.0.0, © Copyright 2025
          <a href="https://codepred.pl/" style="margin-left:4px; color: #FAFAFA;" target="_blank" data-testid="redirect-to-codepred">
            Codepred
          </a>
        </div>
      </div>
    </footer>
  </template>
  
  <style scoped>
  footer.desktop-header {
    z-index: 10;
    width: 100%;
    height: 68px;
    background-color: #A9AAAE;
    color: #FAFAFA;
    display: flex;
    align-items: center;
  }
  
  @media (max-width: 550px) {
    .footer-desktop {
      display: none;
    }
  }

  @media (max-width: 400px) {
    .remove-padding-smartphone {
      padding: 0px !important;
    }
  }
  
  </style>