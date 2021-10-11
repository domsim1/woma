def write ( int ptr int -- )
  33554436
  syscall3
end

def abs ( int -- int )
  dup 0 < if
    neg
  end
end

def nl ( -- )
  10 mem !
  1
  mem
  1
  write
end

def sayd ( int -- )
  drop
end
