#!/bin/bash

# Copy the generated idl and type files from backend to frontend
cp target/types/betting.ts ../frontend/src/config/
cp target/idl/betting.json ../frontend/src/config/idl.json
