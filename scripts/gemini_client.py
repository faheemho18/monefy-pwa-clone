#!/usr/bin/env python3
"""
Enhanced Gemini Client with Delegation Capabilities
Spawns agents for research and general task delegation with iterative quality improvement
"""

import os
import requests
import random
import sys
import argparse
import json
from dotenv import load_dotenv
from datetime import datetime
import re

# Load environment variables
load_dotenv()

class EnhancedGeminiClient:
    """Enhanced Gemini client for research and general task delegation"""
    
    def __init__(self, model="gemini-2.5-pro", timeout=30, specific_key=None):
        self.model = model
        self.base_url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent"
        self.timeout = timeout
        self.api_keys = self._load_api_keys()
        self.last_created_file = None
        self.specific_key = specific_key
        self.last_used_key_number = None
        
        if not self.api_keys:
            raise ValueError("No API keys found! Please check your .env file.")
        
        print(f"Loaded {len(self.api_keys)} API keys")
        if specific_key:
            print(f"Using specific key: {specific_key}")
    
    def _load_api_keys(self):
        """Load all API keys from environment variables"""
        keys = []
        i = 1
        while True:
            key = os.getenv(f'GEMINI_API_KEY_{i}')
            if key and key != 'your_api_key_here':
                keys.append(key)
                i += 1
            else:
                break
        return keys
    
    def _get_next_key(self):
        """Get the next API key using specific key or round-robin with .env file counter"""
        if self.specific_key:
            # Use specific key without updating counter
            array_index = (self.specific_key - 1) % len(self.api_keys)
            self.last_used_key_number = self.specific_key
            return self.api_keys[array_index]
        
        # Load current counter from .env file (1-based)
        current_key_number = self._load_key_index()
        
        # Convert to 0-based index for array access
        array_index = (current_key_number - 1) % len(self.api_keys)
        
        # Get the key at current index
        selected_key = self.api_keys[array_index]
        
        # Store the key number that was actually used
        self.last_used_key_number = current_key_number
        
        # Increment counter for next use (stay in 1-based numbering)
        # Fix: Properly handle 1-20 cycling
        if current_key_number >= len(self.api_keys):
            next_key_number = 1
        else:
            next_key_number = current_key_number + 1
        self._save_key_index(next_key_number)
        
        return selected_key
    
    def _load_key_index(self):
        """Load the key index from .env file (1-based numbering)"""
        try:
            with open('.env', 'r') as f:
                lines = f.readlines()
            
            for line in lines:
                if line.strip().startswith('GEMINI_KEY_INDEX='):
                    return int(line.strip().split('=')[1])
            
            # If not found, return 1 (first key)
            return 1
        except (FileNotFoundError, ValueError, IndexError):
            return 1
    
    def _save_key_index(self, index):
        """Save the key index to .env file"""
        try:
            # Read existing .env file
            try:
                with open('.env', 'r') as f:
                    lines = f.readlines()
            except FileNotFoundError:
                lines = []
            
            # Update or add the GEMINI_KEY_INDEX line
            updated = False
            for i, line in enumerate(lines):
                if line.strip().startswith('GEMINI_KEY_INDEX='):
                    lines[i] = f'GEMINI_KEY_INDEX={index}\n'
                    updated = True
                    break
            
            # If not found, add it
            if not updated:
                lines.append(f'GEMINI_KEY_INDEX={index}\n')
            
            # Write back to .env file
            with open('.env', 'w') as f:
                f.writelines(lines)
                
        except Exception as e:
            print(f"Warning: Could not save key index to .env file: {e}")
            # Fall back to runtime environment variable
            os.environ['GEMINI_KEY_INDEX'] = str(index)
    
    def _sanitize_filename(self, text, max_length=50):
        """Create a safe filename from text"""
        # Remove or replace invalid characters
        sanitized = re.sub(r'[<>:"/\\|?*]', '', text)
        # Replace spaces and other characters with underscores
        sanitized = re.sub(r'[\s\-\.]+', '_', sanitized)
        # Remove multiple underscores
        sanitized = re.sub(r'_+', '_', sanitized)
        # Remove leading/trailing underscores
        sanitized = sanitized.strip('_')
        # Truncate to max length
        if len(sanitized) > max_length:
            sanitized = sanitized[:max_length]
        # Ensure it's not empty
        if not sanitized:
            sanitized = "research_report"
        return sanitized.lower()
    
    def _extract_topic_keywords(self, prompt, max_words=3):
        """Extract key topic words from prompt for filename"""
        stop_words = {
            'research', 'analyze', 'study', 'investigate', 'examine', 'explore',
            'the', 'and', 'or', 'in', 'on', 'about', 'for', 'with', 'by', 'from',
            'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
            'should', 'may', 'might', 'can', 'must', 'shall', 'why', 'how', 'what'
        }
        
        words = [
            word.lower().strip('.,!?;:()[]{}"\'-') 
            for word in prompt.split() 
            if word.lower().strip('.,!?;:()[]{}"\'-') not in stop_words and len(word) > 2
        ]
        
        return '_'.join(words[:max_words])
    
    def _make_request(self, prompt):
        """Make a request to Gemini API with balanced key selection and retry logic"""
        
        attempt = 0
        used_specific_key = False
        
        while True:  # Keep trying until success!
            try:
                # Get next key in balanced rotation or specific key
                if self.specific_key and not used_specific_key:
                    # Use specific key first
                    api_key = self._get_next_key()
                    used_specific_key = True
                else:
                    # Fall back to balanced rotation from .env
                    temp_specific_key = self.specific_key
                    self.specific_key = None  # Temporarily disable specific key
                    api_key = self._get_next_key()
                    self.specific_key = temp_specific_key  # Restore specific key
                
                # Progressive timeout with cycling: 60s, 90s, 120s, 180s, then repeat
                timeout_cycle = [60, 90, 120, 180]
                timeout = timeout_cycle[attempt % len(timeout_cycle)]
                
                # Prepare payload
                payload = {
                    "contents": [{
                        "parts": [{"text": prompt}]
                    }]
                }
                
                url = f"{self.base_url}?key={api_key}"
                
                # Make request with cycling timeout
                response = requests.post(
                    url,
                    json=payload,
                    timeout=timeout,
                    headers={'Content-Type': 'application/json'}
                )
                
                if response.status_code == 200:
                    return {
                        "success": True,
                        "response": response.json(),
                        "api_key_used": f"Key ending in ...{api_key[-4:]}",
                        "attempt": attempt + 1,
                        "timeout_used": timeout
                    }
                elif response.status_code == 403:
                    print(f"Attempt {attempt + 1}: Rate limit (key ...{api_key[-4:]}), trying next key...")
                    attempt += 1
                    continue
                elif response.status_code == 400:
                    print(f"Attempt {attempt + 1}: Invalid key ...{api_key[-4:]}, trying next key...")
                    attempt += 1
                    continue
                else:
                    print(f"Attempt {attempt + 1}: HTTP {response.status_code} (key ...{api_key[-4:]}), trying next key...")
                    attempt += 1
                    continue
                        
            except requests.exceptions.Timeout:
                print(f"Attempt {attempt + 1}: Timeout after {timeout}s (key ...{api_key[-4:]}), trying next key...")
                attempt += 1
                continue
            except Exception as e:
                print(f"Attempt {attempt + 1}: Error with key ...{api_key[-4:]} - {str(e)}, trying next key...")
                attempt += 1
                continue
    
    def _extract_response_text(self, response_json):
        """Extract text from Gemini API response"""
        try:
            candidates = response_json.get('candidates', [])
            if candidates and len(candidates) > 0:
                content = candidates[0].get('content', {})
                parts = content.get('parts', [])
                if parts and len(parts) > 0:
                    return parts[0].get('text', '')
        except Exception as e:
            print(f"Error extracting response text: {e}")
        return ""
    
    def _create_research_report(self, prompt, response_text, output_dir="outputs", used_key_number=None):
        """Create a research report file"""
        try:
            # Create output directory
            os.makedirs(output_dir, exist_ok=True)
            
            # Determine agent number for filename prefix
            if self.specific_key:
                agent_number = self.specific_key
            elif used_key_number:
                agent_number = used_key_number
            else:
                # Fallback to current index (this shouldn't happen in normal usage)
                agent_number = self._load_key_index()
            
            # Generate filename based on prompt with AGENT prefix
            topic_keywords = self._extract_topic_keywords(prompt)
            filename = f"AGENT{agent_number}_{topic_keywords}_RESEARCH.md"
            
            filepath = os.path.join(output_dir, filename)
            
            # Create report content
            report_content = f"""# Research Report
**Topic:** {prompt}
**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Model:** {self.model}

---

## Research Findings

{response_text}

---

*Report generated by Enhanced Gemini Client*
"""
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(report_content)
            
            self.last_created_file = filepath
            print(f"[CREATED] Research report: {filename} (using agent key: {agent_number})")
            return filepath
            
        except Exception as e:
            print(f"Error creating research report: {e}")
            return None
    
    def _create_task_report(self, task_description, response_text, output_dir="outputs", used_key_number=None):
        """Create a task completion report file"""
        try:
            # Create output directory
            os.makedirs(output_dir, exist_ok=True)
            
            # Determine agent number for filename prefix
            if self.specific_key:
                agent_number = self.specific_key
            elif used_key_number:
                agent_number = used_key_number
            else:
                # Fallback to current index
                agent_number = self._load_key_index()
            
            # Generate filename based on task with AGENT prefix
            task_keywords = self._extract_topic_keywords(task_description)
            filename = f"AGENT{agent_number}_{task_keywords}_TASK.md"
            
            filepath = os.path.join(output_dir, filename)
            
            # Create task report content
            report_content = f"""# Task Completion Report
**Task:** {task_description}
**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
**Model:** {self.model}

---

## Task Results

{response_text}

---

*Task completed by Enhanced Gemini Client*
"""
            
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(report_content)
            
            self.last_created_file = filepath
            print(f"[CREATED] Task report: {filename} (using agent key: {agent_number})")
            return filepath
            
        except Exception as e:
            print(f"Error creating task report: {e}")
            return None
    
    def _create_task_variants(self, base_task, agent_count):
        """Split task into different approaches/angles for multiple agents"""
        if agent_count == 1:
            return [base_task]
        
        variant_prompts = {
            2: [
                f"Approach 1 - Strategic perspective: {base_task}",
                f"Approach 2 - Implementation focus: {base_task}"
            ],
            3: [
                f"Strategic analysis approach: {base_task}",
                f"Technical implementation approach: {base_task}", 
                f"Risk assessment and mitigation approach: {base_task}"
            ],
            4: [
                f"Strategic planning perspective: {base_task}",
                f"Technical implementation details: {base_task}",
                f"Risk analysis and contingencies: {base_task}",
                f"Resource requirements and timeline: {base_task}"
            ],
            5: [
                f"Strategic overview and goals: {base_task}",
                f"Technical architecture and implementation: {base_task}",
                f"Risk management and quality assurance: {base_task}",
                f"Resource planning and budget considerations: {base_task}",
                f"Timeline, milestones, and success metrics: {base_task}"
            ]
        }
        
        if agent_count in variant_prompts:
            return variant_prompts[agent_count]
        else:
            # For 6+ agents, create generic variants
            variants = []
            approaches = [
                "Strategic planning", "Technical implementation", "Risk assessment",
                "Resource management", "Timeline planning", "Quality assurance",
                "Stakeholder analysis", "Budget considerations"
            ]
            
            for i in range(agent_count):
                approach = approaches[i % len(approaches)]
                variants.append(f"{approach} approach: {base_task}")
            
            return variants
    
    def _assess_task_quality(self, task_result, original_task):
        """Assess task completion quality using task-specific criteria"""
        # Simple quality assessment prompt
        assessment_prompt = f"""Please assess the quality of this task completion on a scale of 1-10 based on the following criteria:

TASK COMPLETION (40% weight):
- Addresses all aspects of the request
- Provides actionable outputs  
- Clear structure and organization

ACCURACY & RELEVANCE (30% weight):
- Factually correct information
- Directly relevant to task
- No contradictions

PRACTICAL VALUE (30% weight):
- Implementable solutions
- Real-world applicability
- Clear next steps

ORIGINAL TASK: {original_task}

TASK RESULT TO ASSESS:
{task_result}

Please provide:
1. A numerical score from 1-10
2. Brief explanation of the score
3. Specific areas for improvement if score < 7

Format your response as:
SCORE: [number]
EXPLANATION: [brief explanation]
IMPROVEMENTS: [specific improvements needed, or "None" if score >= 7]"""

        # Make assessment request (this uses next available key)
        original_specific_key = self.specific_key
        self.specific_key = None  # Use key rotation for assessment
        
        try:
            result = self._make_request(assessment_prompt)
            if result["success"]:
                assessment_text = self._extract_response_text(result["response"])
                
                # Extract score from assessment
                score = 5  # default fallback
                try:
                    for line in assessment_text.split('\n'):
                        if line.strip().startswith('SCORE:'):
                            score = float(line.split(':')[1].strip())
                            break
                except:
                    pass
                
                return {
                    "score": score,
                    "assessment": assessment_text
                }
            else:
                return {"score": 5, "assessment": "Assessment failed"}
        finally:
            self.specific_key = original_specific_key
    
    def _generate_improvement_points(self, task_result, assessment_text):
        """Generate specific improvement suggestions for task completion"""
        try:
            # Extract improvements from assessment
            for line in assessment_text.split('\n'):
                if line.strip().startswith('IMPROVEMENTS:'):
                    improvements = line.split(':', 1)[1].strip()
                    if improvements and improvements.lower() != "none":
                        return improvements
            
            # Fallback generic improvement
            return "Please provide more detailed analysis, clearer actionable steps, and better organization of the content."
        except:
            return "Please improve the completeness, clarity, and practical applicability of the task results."
    
    def research(self, prompt, output_dir="outputs"):
        """Conduct research and create a report"""
        print(f"[RESEARCH] Starting research on: {prompt[:100]}...")
        
        # Make request to Gemini
        result = self._make_request(prompt)
        
        if result["success"]:
            response_text = self._extract_response_text(result["response"])
            print(f"[SUCCESS] Research completed using {result['api_key_used']}")
            
            # Create research report
            filepath = self._create_research_report(prompt, response_text, output_dir, self.last_used_key_number)
            
            if filepath:
                return {
                    "success": True,
                    "filepath": filepath,
                    "filename": os.path.basename(filepath),
                    "response": response_text
                }
            else:
                return {
                    "success": False,
                    "error": "Failed to create research report"
                }
        else:
            print(f"[ERROR] Research failed: {result['error']}")
            return {
                "success": False,
                "error": result['error']
            }
    
    def delegate_task(self, task_description, agent_count=1, max_iterations=3, output_dir="outputs"):
        """Delegate a task to multiple Gemini agents with iterative improvement"""
        print(f"[DELEGATE] Starting task delegation: {task_description[:100]}...")
        print(f"[DELEGATE] Spawning {agent_count} agent(s), max {max_iterations} iterations each")
        
        # Create task variants for multiple agents
        task_variants = self._create_task_variants(task_description, agent_count)
        
        results = []
        
        for i, variant_task in enumerate(task_variants):
            agent_num = i + 1
            print(f"\n[AGENT {agent_num}] Starting task: {variant_task[:80]}...")
            
            # Temporarily set specific key for this agent
            original_specific_key = self.specific_key
            # If specific key was set during initialization, use it (orchestration mode)
            if original_specific_key is not None:
                # Use the pre-assigned key (for orchestrated delegation)
                agent_key = original_specific_key
                print(f"[AGENT {agent_num}] Using assigned key: {agent_key}")
            else:
                # Use automatic assignment for standalone delegation
                current_key_index = self._load_key_index()
                agent_key = ((current_key_index - 1 + i) % len(self.api_keys)) + 1
                self.specific_key = agent_key
                print(f"[AGENT {agent_num}] Auto-assigned key: {agent_key}")
            
            try:
                # Initial task execution
                result = self._make_request(variant_task)
                
                if result["success"]:
                    response_text = self._extract_response_text(result["response"])
                    print(f"[AGENT {agent_num}] Initial completion using {result['api_key_used']}")
                    
                    # Create initial task report
                    filepath = self._create_task_report(variant_task, response_text, output_dir, self.last_used_key_number)
                    
                    current_quality = 0
                    iteration = 1
                    
                    # Quality improvement loop
                    while iteration <= max_iterations:
                        # Assess quality
                        quality_result = self._assess_task_quality(response_text, task_description)
                        current_quality = quality_result["score"]
                        
                        print(f"[AGENT {agent_num}] Iteration {iteration} quality: {current_quality}/10")
                        
                        if current_quality >= 7.0:
                            print(f"[AGENT {agent_num}] Quality threshold met!")
                            break
                        
                        if iteration >= max_iterations:
                            print(f"[AGENT {agent_num}] Max iterations reached")
                            break
                        
                        # Generate improvement points
                        improvement_points = self._generate_improvement_points(response_text, quality_result["assessment"])
                        
                        # Improve the task (uses key rotation)
                        self.specific_key = None  # Use key rotation for improvement
                        improve_result = self.improve_task(improvement_points, filepath)
                        self.specific_key = agent_key  # Restore agent key
                        
                        if improve_result["success"]:
                            response_text = improve_result["response"]
                            print(f"[AGENT {agent_num}] Iteration {iteration + 1} improvement completed")
                        else:
                            print(f"[AGENT {agent_num}] Improvement failed: {improve_result['error']}")
                            break
                        
                        iteration += 1
                    
                    # Final result for this agent
                    agent_result = {
                        "agent_number": agent_num,
                        "task": variant_task,
                        "filepath": filepath,
                        "filename": os.path.basename(filepath),
                        "final_quality": current_quality,
                        "iterations": iteration,
                        "success": True
                    }
                    results.append(agent_result)
                    
                else:
                    print(f"[AGENT {agent_num}] Failed: {result['error']}")
                    results.append({
                        "agent_number": agent_num,
                        "task": variant_task,
                        "success": False,
                        "error": result['error']
                    })
            
            finally:
                self.specific_key = original_specific_key
        
        # Update key index for next use (only if not using pre-assigned keys)
        if original_specific_key is None:
            next_index = ((current_key_index - 1 + agent_count) % len(self.api_keys)) + 1
            self._save_key_index(next_index)
        
        return {
            "success": True,
            "agent_count": agent_count,
            "results": results,
            "task_description": task_description
        }
    
    def improve_task(self, improvement_points, filename):
        """Improve an existing task file based on improvement points"""
        print(f"[IMPROVE] Improving task file: {filename}")
        print(f"[IMPROVE] Improvement points: {improvement_points[:100]}...")
        
        # Temporarily disable specific key for improvement
        original_specific_key = self.specific_key
        self.specific_key = None
        
        try:
            # Read existing file
            if not os.path.exists(filename):
                return {
                    "success": False,
                    "error": f"File not found: {filename}"
                }
            
            try:
                with open(filename, 'r', encoding='utf-8') as f:
                    existing_content = f.read()
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Failed to read file: {e}"
                }
            
            # Create improvement prompt
            improvement_prompt = f"""You are tasked with improving an existing task completion report. 

EXISTING TASK CONTENT:
{existing_content}

IMPROVEMENT POINTS TO ADDRESS:
{improvement_points}

INSTRUCTIONS:
1. Read and understand the existing task content above
2. Address the specific improvement points mentioned
3. Enhance the existing work while maintaining the overall structure
4. Keep the same markdown format with the header information
5. Provide the complete improved task report

Please provide the complete improved task completion report:"""
            
            # Make request to Gemini for improvement
            result = self._make_request(improvement_prompt)
            
            if result["success"]:
                improved_text = self._extract_response_text(result["response"])
                print(f"[SUCCESS] Task improved using {result['api_key_used']}")
                
                # Write improved content back to the same file
                try:
                    with open(filename, 'w', encoding='utf-8') as f:
                        f.write(improved_text)
                    
                    print(f"[UPDATED] File updated: {filename}")
                    return {
                        "success": True,
                        "filepath": filename,
                        "filename": os.path.basename(filename),
                        "response": improved_text
                    }
                except Exception as e:
                    return {
                        "success": False,
                        "error": f"Failed to write improved content: {e}"
                    }
            else:
                print(f"[ERROR] Improvement failed: {result['error']}")
                return {
                    "success": False,
                    "error": result['error']
                }
        
        finally:
            # Restore original specific key setting
            self.specific_key = original_specific_key
    
    def improve(self, improvement_points, filename):
        """Improve an existing research file based on improvement points using fresh perspective"""
        print(f"[IMPROVE] Improving file: {filename}")
        print(f"[IMPROVE] Improvement points: {improvement_points[:100]}...")
        
        # Temporarily disable specific key for improvement (use current index progression)
        original_specific_key = self.specific_key
        self.specific_key = None
        
        try:
            # Read existing file
            if not os.path.exists(filename):
                return {
                    "success": False,
                    "error": f"File not found: {filename}"
                }
            
            try:
                with open(filename, 'r', encoding='utf-8') as f:
                    existing_content = f.read()
            except Exception as e:
                return {
                    "success": False,
                    "error": f"Failed to read file: {e}"
                }
            
            # Create improvement prompt
            improvement_prompt = f"""You are tasked with improving an existing research report. 

EXISTING RESEARCH CONTENT:
{existing_content}

IMPROVEMENT POINTS TO ADDRESS:
{improvement_points}

INSTRUCTIONS:
1. Read and understand the existing research content above
2. Address the specific improvement points mentioned
3. Enhance the existing research while maintaining the overall structure
4. Keep the same markdown format with the header information
5. Provide the complete improved report

Please provide the complete improved research report:"""
            
            # Make request to Gemini for improvement (this will use and increment current key index)
            result = self._make_request(improvement_prompt)
            
            if result["success"]:
                improved_text = self._extract_response_text(result["response"])
                print(f"[SUCCESS] Research improved using {result['api_key_used']}")
                
                # Write improved content back to the same file (filename stays consistent)
                try:
                    with open(filename, 'w', encoding='utf-8') as f:
                        f.write(improved_text)
                    
                    print(f"[UPDATED] File updated: {filename}")
                    return {
                        "success": True,
                        "filepath": filename,
                        "filename": os.path.basename(filename),
                        "response": improved_text
                    }
                except Exception as e:
                    return {
                        "success": False,
                        "error": f"Failed to write improved content: {e}"
                    }
            else:
                print(f"[ERROR] Improvement failed: {result['error']}")
                return {
                    "success": False,
                    "error": result['error']
                }
        
        finally:
            # Restore original specific key setting
            self.specific_key = original_specific_key
    
    def get_last_created_file(self):
        """Get the path of the last created file"""
        return self.last_created_file

def main():
    """Main CLI interface"""
    parser = argparse.ArgumentParser(description="Enhanced Gemini Client with Delegation Capabilities")
    parser.add_argument("--research", help="Research topic/prompt")
    parser.add_argument("--delegate", help="Delegate any task to Gemini agents")
    parser.add_argument("--agents", type=int, default=1, help="Number of agents to spawn for delegation (1-8)")
    parser.add_argument("--iterations", type=int, default=3, help="Max iterations per agent for quality improvement")
    parser.add_argument("--improve", nargs=2, metavar=('IMPROVEMENT_POINTS', 'FILENAME'), 
                       help="Improve existing research file. Usage: --improve 'improvement points' 'filename'")
    parser.add_argument("--orchestrate", nargs=2, metavar=('TASK', 'AGENT_COUNT'), 
                       help="Orchestrate multiple parallel agents with proper key management. Usage: --orchestrate 'task' N")
    parser.add_argument("--key", type=int, help="Specific API key number to use (1-20)")
    parser.add_argument("-m", "--model", default="gemini-2.5-pro", help="Model to use")
    parser.add_argument("-t", "--timeout", type=int, default=30, help="Request timeout")
    parser.add_argument("-o", "--output", default="outputs", help="Output directory")
    parser.add_argument("-v", "--verbose", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    # Check for mutually exclusive arguments
    action_count = sum([
        bool(args.research),
        bool(args.delegate), 
        bool(args.improve),
        bool(args.orchestrate)
    ])
    
    if action_count == 0:
        print("Error: One of --research, --delegate, --orchestrate, or --improve flag is required")
        print("Usage:")
        print("  Research:    python gemini_client.py --research 'Your research topic'")
        print("  Delegate:    python gemini_client.py --delegate 'Your task' [--agents N] [--iterations M]")
        print("  Orchestrate: python gemini_client.py --orchestrate 'Your task' N")
        print("  Improve:     python gemini_client.py --improve 'improvement points' 'filename'")
        sys.exit(1)
    
    if action_count > 1:
        print("Error: Only one of --research, --delegate, --orchestrate, or --improve can be used at a time")
        sys.exit(1)
    
    # Validate that --key is not used with --improve
    if args.improve and args.key:
        print("Error: --key flag cannot be used with --improve flag")
        print("The --improve operation uses automatic key rotation for fresh perspectives")
        sys.exit(1)
    
    # Allow --key with --delegate for orchestration mode
    # if args.delegate and args.key:
    #     print("Error: --key flag cannot be used with --delegate flag") 
    #     print("The --delegate operation manages key assignments automatically")
    #     sys.exit(1)
    
    if args.orchestrate and args.key:
        print("Error: --key flag cannot be used with --orchestrate flag")
        print("The --orchestrate operation manages key assignments automatically")
        sys.exit(1)
    
    # Validate delegation parameters
    if args.delegate:
        if args.agents < 1 or args.agents > 8:
            print("Error: --agents must be between 1 and 8")
            sys.exit(1)
        if args.iterations < 1 or args.iterations > 10:
            print("Error: --iterations must be between 1 and 10")
            sys.exit(1)
    
    try:
        client = EnhancedGeminiClient(model=args.model, timeout=args.timeout, specific_key=args.key)
        
        if args.research:
            # Conduct research
            result = client.research(args.research, args.output)
            
            if result["success"]:
                print(f"[SUCCESS] Research completed successfully")
                print(f"[FILE] Created: {result['filepath']}")
                print(f"[NAME] Filename: {result['filename']}")
                
                if args.verbose:
                    print(f"[RESPONSE] {result['response'][:200]}...")
            else:
                print(f"[FAILED] Research failed: {result['error']}")
                sys.exit(1)
        
        elif args.delegate:
            # Delegate task to multiple agents
            result = client.delegate_task(args.delegate, args.agents, args.iterations, args.output)
            
            if result["success"]:
                print(f"\n[DELEGATION COMPLETE] Task: {args.delegate}")
                print(f"[SUMMARY] {result['agent_count']} agent(s) deployed")
                
                successful_agents = [r for r in result['results'] if r['success']]
                failed_agents = [r for r in result['results'] if not r['success']]
                
                if successful_agents:
                    print(f"[SUCCESS] {len(successful_agents)} agent(s) completed successfully:")
                    for agent_result in successful_agents:
                        print(f"  - Agent {agent_result['agent_number']}: {agent_result['filename']} "
                              f"(Quality: {agent_result['final_quality']}/10, Iterations: {agent_result['iterations']})")
                
                if failed_agents:
                    print(f"[FAILED] {len(failed_agents)} agent(s) failed:")
                    for agent_result in failed_agents:
                        print(f"  - Agent {agent_result['agent_number']}: {agent_result['error']}")
                
                if args.verbose and successful_agents:
                    print(f"\n[DETAILED RESULTS]")
                    for agent_result in successful_agents:
                        print(f"Agent {agent_result['agent_number']} Task: {agent_result['task'][:100]}...")
            else:
                print(f"[FAILED] Task delegation failed")
                sys.exit(1)
        
        elif args.improve:
            # Improve existing research/task
            improvement_points, filename = args.improve
            result = client.improve(improvement_points, filename)
            
            if result["success"]:
                print(f"[SUCCESS] File improved successfully")
                print(f"[FILE] Updated: {result['filepath']}")
                print(f"[NAME] Filename: {result['filename']}")
                
                if args.verbose:
                    print(f"[RESPONSE] {result['response'][:200]}...")
            else:
                print(f"[FAILED] Improvement failed: {result['error']}")
                sys.exit(1)
            
    except ValueError as e:
        print(f"Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()