# Encoder/Decoder Tool

A modern, versatile encoding and decoding tool that supports multiple formats including Base64, URL encoding, HTML entities, and Hexadecimal.

## Features

### Base64 Encoding/Decoding
- Standard Base64 encoding and decoding
- URL-safe Base64 variant (using `-` and `_` instead of `+` and `/`)
- Option to remove padding characters (`=`)

### URL Encoding/Decoding
- Standard URL encoding (encodeURI)
- URI Component encoding (encodeURIComponent)

### HTML Entity Encoding/Decoding
- Convert special characters to HTML entities
- Convert HTML entities back to characters

### Hex Encoding/Decoding
- Convert text to hexadecimal representation
- Optional uppercase hex output
- Optional 0x prefix

## Usage

1. Select the encoding format (Base64, URL, HTML, or Hex)
2. Enter the text you want to encode or decode in the input field
3. Click the appropriate button (Encode or Decode)
4. View the result in the output field
5. Copy or download the result as needed

## Advanced Options

Each encoding format has specific options:

### Base64 Options
- **URL-safe Base64**: Uses `-` instead of `+` and `_` instead of `/`
- **No padding**: Removes trailing `=` characters

### URL Options
- **Encode/decode URI Component**: Uses encodeURIComponent/decodeURIComponent instead of encodeURI/decodeURI

### Hex Options
- **Uppercase hex**: Outputs hex in uppercase (e.g., `48656C6C6F` instead of `48656c6c6f`)
- **Add 0x prefix**: Adds `0x` prefix to the hex output

## Keyboard Shortcuts

- **Ctrl+E** (or **Cmd+E** on Mac): Encode
- **Ctrl+D** (or **Cmd+D** on Mac): Decode

## Implementation Details

The tool uses JavaScript's built-in encoding/decoding functions where possible:

- **Base64**: `btoa()` and `atob()` with UTF-8 handling
- **URL**: `encodeURI()`/`decodeURI()` and `encodeURIComponent()`/`decodeURIComponent()`
- **HTML**: DOM methods for HTML entity conversion
- **Hex**: Custom implementation using character code conversion

## Browser Compatibility

This tool is compatible with all modern browsers (Chrome, Firefox, Safari, Edge).
