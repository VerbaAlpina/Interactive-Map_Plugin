<?php
	class IM_Tree {
		private $value;
		private $depth;
		private $parent;
		private $children = array();
		private $properties;
		
		function __construct ($value, $properties = array()){
			$this->value = $value;
			$this->depth = 1;
			$this->parent = null;
			$this->properties = $properties;
		}
		
		public static function arrayToTreePath ($arr, $breakAtEmptyString = false, $leafProperties = array()){
			$curr_value = reset($arr);
			$result = new IM_Tree($curr_value);
			$curr_node = $result;
			
			$curr_value = next($arr);
			while ($curr_value !== false && (!$breakAtEmptyString || $curr_value !== '')){
				$curr_node->addLeaf($curr_value);
				$curr_node = $curr_node->getChild(0);
				$curr_value = next($arr);
			}
			$curr_node->properties = $leafProperties;
			return $result;
		}
		
		public function hasChildren (){
			return !empty($this->children);
		}
		
		public function getChildrenCount (){
			return count($this->children);
		}
		
		public function getChild ($index){
			return $this->children[$index];
		}
		
		public function getValue (){
			return $this->value;
		}
		
		public function getDepth (){
			return $this->depth;
		}
		
		private function setDepth ($newDepth){
			$this->depth = $newDepth;
			if($this->parent !== null){
				$depthParent = $this->parent->getDepth();
				if($depthParent < $newDepth + 1){
					$this->parent->setDepth($newDepth + 1);
				}
			}
		}
		
		public function addLeaf ($value, $properties = array()){
			foreach ($this->children as $child){
				if($child->getValue() === $value){
					//Ignore duplicates
					return false;
				}	
			}
			if(empty($this->children)){
				$this->setDepth(2);
			}
			$newChild = new IM_Tree($value, $properties);
			$newChild->parent = $this;
			$this->children[] = $newChild;
			return true;
		}
		
		public function addSubTree (IM_Tree $subtree){
			$duplicate = false;
			foreach ($this->children as $child){
				if($child->getValue () === $subtree->getValue()){
					$duplicate = true;
					$numChildren = $subtree->getChildrenCount();
					for ($i = 0; $i < $numChildren; $i++){
						$child->addSubTree($subtree->getChild($i));
					}
					break;
				}
			}
			if($duplicate === false){
				$newDepth = $subtree->getDepth() + 1;
				if($this->depth < $newDepth){
					$this->setDepth($newDepth);
				}
				$this->depth = max($this->depth, $subtree->getDepth() + 1);
				$this->children[] = $subtree;
				$subtree->parent = $this;
			}			
		}
		
		public function getCopy (){
			$result = new IM_Tree($this->value);
			foreach ($this->children as $child){
				$newChild = $child->getCopy();
				$newChild->parent = $this;
				$result->children[] = $newChild;
			}
			return $result;
		}
		
		public function toHtml ($attr_arr){
			$attr_string = '';
			if($attr_arr){
				foreach ($attr_arr as $name => $value){
					$attr_string .= ' ' . $name . '="' . $value . '"'; 
				}
			}
			return '<ul' . $attr_string . '>' . $this->createListItem() . '</ul>';
		}
		
		/**
		 * Sorts all levels of the tree
		 * 
		 * e.g.
		 *   A
		 *   /\
		 *  C  B
		 *     |
		 *     D
		 * becomes
		 *   A
		 *   /\
		 *  B  C
		 *  |
		 *  D
		 */
		public function sort (){
			usort($this->children, function ($e1, $e2){
				return strcmp($e1->value, $e2->value);
			});
			
			foreach ($this->children as &$child){
				$child->sort();	
			}
		}
		
		private function createListItem (){
			
			$attr_string = '';
			if(!empty($this->properties)){
				foreach($this->properties as $name => $value){
					$attr_string .= ' ' . $name . '="' . $value . '"'; 
				}
			}
			
			$result = '<li><a' . $attr_string . '>' . $this->value . '</a>';
			if($this->hasChildren()){
				$leafContainer = true;
				foreach($this->children as $curr_child){
					if($curr_child->hasChildren()){
						$leafContainer = false;
						break;
					}
				}
				if($leafContainer)
					$result .= '<ul class="leafContainer">';
				else
					$result .= '<ul>';
				foreach ($this->children as $child){
					$result .= $child->createListItem($attr_string);
				}
				$result .= '</ul>';	
			}
				
			$result .= '</li>';
			return $result;
		}
		
		public function __toString (){
			return $this->toHtml(false);
		}
	}
?>